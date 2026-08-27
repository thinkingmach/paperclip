import { spawn, type ChildProcess } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertIsolatedServerEnvironment,
  buildThinkingMachServerEnvironment,
  runnerE2EServerControlPaths,
} from "./harness-env.js";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const logPath = required("THINKINGMACH_RUNNER_E2E_SERVER_LOG");
const temporaryRoot = required("THINKINGMACH_RUNNER_E2E_TEMP_ROOT");
const paperclipHome = required("THINKINGMACH_HOME");
const configPath = required("THINKINGMACH_CONFIG");
const port = required("THINKINGMACH_RUNNER_E2E_PORT");
const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const tsxCli = path.join(repositoryRoot, "cli/node_modules/tsx/dist/cli.mjs");
const paperclipCli = path.join(repositoryRoot, "cli/src/index.ts");
const {
  controlDirectory,
  restartRequestPath,
  restartAcknowledgementPath: restartAckPath,
} = runnerE2EServerControlPaths(temporaryRoot);
const restartTimeoutMs = 180_000;
const gracefulStopTimeoutMs = 30_000;
const serverEnvironment = buildThinkingMachServerEnvironment(process.env, {
  NODE_ENV: "test",
  PORT: port,
  // Keep provider caches attempt-private without changing Playwright's browser
  // cache lookup in the parent process.
  XDG_CACHE_HOME: path.join(temporaryRoot, "xdg-cache"),
  THINKINGMACH_HOME: paperclipHome,
  THINKINGMACH_CONFIG: configPath,
  THINKINGMACH_INSTANCE_ID: required("THINKINGMACH_INSTANCE_ID"),
  THINKINGMACH_AGENT_JWT_SECRET: required("THINKINGMACH_AGENT_JWT_SECRET"),
  THINKINGMACH_DECISION_SIGNING_SECRET: required(
    "THINKINGMACH_DECISION_SIGNING_SECRET",
  ),
  THINKINGMACH_TOOL_ACTION_SIGNING_SECRET: required(
    "THINKINGMACH_TOOL_ACTION_SIGNING_SECRET",
  ),
  BETTER_AUTH_SECRET: required("BETTER_AUTH_SECRET"),
  THINKINGMACH_BIND: "loopback",
  THINKINGMACH_BIND_HOST: "127.0.0.1",
  THINKINGMACH_DEPLOYMENT_MODE: "local_trusted",
  THINKINGMACH_DEPLOYMENT_EXPOSURE: "private",
  SERVE_UI: "true",
  THINKINGMACH_STORAGE_PROVIDER: "local_disk",
  THINKINGMACH_STORAGE_LOCAL_DIR: path.join(temporaryRoot, "storage"),
  THINKINGMACH_SECRETS_PROVIDER: "local_encrypted",
  THINKINGMACH_SECRETS_STRICT_MODE: "true",
  THINKINGMACH_DB_BACKUP_ENABLED: "false",
  THINKINGMACH_DB_BACKUP_DIR: path.join(temporaryRoot, "backups"),
  // Onboarding normally opens the app after listen. Browser ownership belongs
  // to Playwright in this harness, so never create a developer desktop tab.
  THINKINGMACH_OPEN_ON_LISTEN: "false",
});
assertIsolatedServerEnvironment(serverEnvironment, {
  temporaryRoot,
  paperclipHome,
  configPath,
});
const definedServerEnvironment = Object.fromEntries(
  Object.entries(serverEnvironment).filter(
    (entry): entry is [string, string] => entry[1] !== undefined,
  ),
);

await Promise.all([
  mkdir(path.dirname(logPath), { recursive: true }),
  mkdir(controlDirectory, { recursive: true, mode: 0o700 }),
]);
const log = createWriteStream(logPath, { flags: "a", mode: 0o600 });
const expectedStops = new WeakSet<ChildProcess>();
const childErrors = new WeakMap<ChildProcess, Error>();
let child: ChildProcess | null = null;
let unexpectedChildFailure: Error | null = null;
let shutdownSignal: NodeJS.Signals | null = null;
let activeRestartRequestId: string | null = null;

function appendLog(message: string) {
  process.stderr.write(message);
  log.write(message);
}

function shutdownRequested() {
  return shutdownSignal !== null;
}

function childExited(candidate: ChildProcess) {
  return candidate.exitCode !== null || candidate.signalCode !== null;
}

function describeChildExit(candidate: ChildProcess) {
  const spawnError = childErrors.get(candidate);
  if (spawnError) return `server spawn failed: ${spawnError.message}`;
  return `server exited code=${String(candidate.exitCode)} signal=${String(candidate.signalCode)}`;
}

function startServer() {
  if (shutdownRequested()) {
    throw new Error("Refusing to start ThinkingMach after wrapper shutdown");
  }
  const candidate = spawn(
    process.execPath,
    [tsxCli, paperclipCli, "onboard", "--yes", "--run"],
    {
      cwd: repositoryRoot,
      env: definedServerEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
      // Stay in the launcher-created process group. That lets the launcher stop
      // Playwright, this wrapper, ThinkingMach, embedded Postgres, and runner children
      // as one verified tree even if graceful web-server shutdown stalls.
      detached: false,
    },
  );
  child = candidate;

  candidate.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
    log.write(chunk);
  });
  candidate.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk);
    log.write(chunk);
  });
  candidate.once("error", (error) => {
    childErrors.set(candidate, error);
    if (!expectedStops.has(candidate) && !shutdownRequested()) {
      unexpectedChildFailure = new Error(
        `ThinkingMach server spawn failed: ${error.message}`,
      );
    }
  });
  candidate.once("exit", () => {
    appendLog(`\n${describeChildExit(candidate)}\n`);
    if (!expectedStops.has(candidate) && !shutdownRequested()) {
      unexpectedChildFailure = new Error(
        `ThinkingMach server stopped unexpectedly: ${describeChildExit(candidate)}`,
      );
    }
  });

  // A shutdown may arrive in the synchronous interval around spawn. Never let
  // that race create an unowned replacement server.
  if (shutdownSignal) {
    expectedStops.add(candidate);
    try {
      candidate.kill(shutdownSignal);
    } catch {
      // The process may have failed during spawn.
    }
  }
  return candidate;
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForExit(candidate: ChildProcess, timeoutMs: number) {
  if (childExited(candidate) || childErrors.has(candidate)) return true;
  return await new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (exited: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      candidate.off("exit", onExit);
      candidate.off("error", onError);
      resolve(exited);
    };
    const onExit = () => finish(true);
    const onError = () => finish(true);
    const timeout = setTimeout(() => finish(false), timeoutMs);
    candidate.once("exit", onExit);
    candidate.once("error", onError);
  });
}

async function stopServer(
  candidate: ChildProcess,
  signal: NodeJS.Signals = "SIGTERM",
) {
  expectedStops.add(candidate);
  if (childExited(candidate) || childErrors.has(candidate)) return;
  try {
    candidate.kill(signal);
  } catch {
    if (childExited(candidate) || childErrors.has(candidate)) return;
    throw new Error("Could not signal the ThinkingMach server to stop");
  }
  if (await waitForExit(candidate, gracefulStopTimeoutMs)) return;

  appendLog(
    `\nThinkingMach did not stop within ${gracefulStopTimeoutMs}ms; sending SIGKILL\n`,
  );
  try {
    candidate.kill("SIGKILL");
  } catch {
    if (childExited(candidate) || childErrors.has(candidate)) return;
    throw new Error("Could not force the ThinkingMach server to stop");
  }
  if (!(await waitForExit(candidate, 5_000))) {
    throw new Error("ThinkingMach server did not exit after SIGKILL");
  }
}

async function waitForHealth(candidate: ChildProcess) {
  const deadline = Date.now() + restartTimeoutMs;
  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  while (Date.now() < deadline) {
    if (shutdownRequested()) {
      throw new Error("Wrapper shutdown interrupted the ThinkingMach restart");
    }
    if (childErrors.has(candidate) || childExited(candidate)) {
      throw new Error(
        `Replacement ThinkingMach server could not start: ${describeChildExit(candidate)}`,
      );
    }
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The replacement process may still be booting.
    }
    await delay(250);
  }
  throw new Error(
    `Replacement ThinkingMach server did not become healthy within ${restartTimeoutMs}ms`,
  );
}

async function waitForHealthToStop() {
  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  const deadline = Date.now() + gracefulStopTimeoutMs;
  while (Date.now() < deadline) {
    if (shutdownRequested()) {
      throw new Error("Wrapper shutdown interrupted the ThinkingMach restart");
    }
    try {
      await fetch(healthUrl, { signal: AbortSignal.timeout(500) });
    } catch {
      return;
    }
    await delay(100);
  }
  throw new Error(
    "The old ThinkingMach server remained healthy after its launcher exited",
  );
}

interface RestartRequest {
  requestId: string;
}

async function readRestartRequest(): Promise<RestartRequest | null> {
  let encoded: string;
  try {
    encoded = await readFile(restartRequestPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  let value: unknown;
  try {
    value = JSON.parse(encoded);
  } catch {
    // The writer may not have completed its atomic replacement yet.
    return null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const requestId = (value as { requestId?: unknown }).requestId;
  if (
    typeof requestId !== "string" ||
    !/^[A-Za-z0-9._:-]{1,200}$/.test(requestId)
  ) {
    return null;
  }
  return { requestId };
}

async function writeRestartAck(
  requestId: string,
  status: "ready" | "failed",
  message?: string,
) {
  const temporaryAckPath = `${restartAckPath}.${process.pid}.tmp`;
  await writeFile(
    temporaryAckPath,
    `${JSON.stringify({
      requestId,
      status,
      completedAt: new Date().toISOString(),
      ...(message ? { message } : {}),
    })}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  await rename(temporaryAckPath, restartAckPath);
}

async function restartServer(requestId: string) {
  activeRestartRequestId = requestId;
  appendLog(`\nRestart request ${requestId}: stopping ThinkingMach\n`);
  const previous = child;
  if (!previous) throw new Error("No ThinkingMach server is available to restart");
  await stopServer(previous);
  if (child === previous) child = null;
  // Do not mistake an orphaned old server for a healthy replacement. The port
  // must stop answering before the next launcher is allowed to start.
  await waitForHealthToStop();
  if (shutdownRequested()) {
    throw new Error("Wrapper shutdown interrupted the ThinkingMach restart");
  }

  appendLog(`Restart request ${requestId}: starting ThinkingMach\n`);
  const replacement = startServer();
  await waitForHealth(replacement);
  if (shutdownRequested()) {
    throw new Error("Wrapper shutdown interrupted the ThinkingMach restart");
  }
  await writeRestartAck(requestId, "ready");
  appendLog(`Restart request ${requestId}: ThinkingMach is healthy\n`);
  activeRestartRequestId = null;
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => {
    if (shutdownSignal) return;
    shutdownSignal = signal;
    if (!child) return;
    expectedStops.add(child);
    try {
      child.kill(signal);
    } catch {
      // The ThinkingMach process may already have exited.
    }
  });
}

async function supervise() {
  startServer();
  let lastRestartRequestId: string | null = null;
  while (!shutdownRequested()) {
    if (unexpectedChildFailure) throw unexpectedChildFailure;
    const request = await readRestartRequest();
    if (request && request.requestId !== lastRestartRequestId) {
      lastRestartRequestId = request.requestId;
      await restartServer(request.requestId);
    }
    await delay(200);
  }

  const running = child;
  if (running) await stopServer(running, shutdownSignal ?? "SIGTERM");
}

let exitCode = 0;
try {
  await supervise();
} catch (error) {
  exitCode = 1;
  const message = error instanceof Error ? error.message : String(error);
  appendLog(`\nThinkingMach E2E server supervisor failed: ${message}\n`);
  if (activeRestartRequestId) {
    try {
      await writeRestartAck(activeRestartRequestId, "failed", message);
    } catch (ackError) {
      appendLog(
        `Failed to write restart acknowledgement: ${ackError instanceof Error ? ackError.message : String(ackError)}\n`,
      );
    }
  }
  const running = child;
  if (running) {
    try {
      await stopServer(running);
    } catch (stopError) {
      appendLog(
        `Failed to stop ThinkingMach after supervisor failure: ${stopError instanceof Error ? stopError.message : String(stopError)}\n`,
      );
    }
  }
}

await new Promise<void>((resolve) => log.end(resolve));
process.exitCode = exitCode;
