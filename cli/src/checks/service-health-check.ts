import fs from "node:fs/promises";
import path from "node:path";
import type { ThinkingMachConfig } from "../config/schema.js";
import { resolveThinkingMachInstanceId } from "../config/home.js";
import { readInstallManifest, resolveInstallStorePaths } from "../install-store.js";
import {
  detectServiceManager,
  isExecutableFile,
  resolveServiceShimPath,
  type ServiceManagerDetection,
} from "../services/service-manager.js";
import { buildLocalHealthUrl } from "../utils/health-url.js";
import type { CheckResult } from "./index.js";

type HealthResult = { ok: boolean; version: string | null; error?: string };
type ServiceCheckDependencies = {
  detect: (instanceId: string) => Promise<ServiceManagerDetection>;
  probe: (config: ThinkingMachConfig) => Promise<HealthResult>;
  shimPresent: (executablePath: string) => Promise<boolean>;
};

async function probeHealth(config: ThinkingMachConfig): Promise<HealthResult> {
  try {
    const response = await fetch(buildLocalHealthUrl(config.server.host, config.server.port), {
      signal: AbortSignal.timeout(2_000),
    });
    const body = (await response.json()) as {
      status?: unknown;
      serverVersion?: unknown;
      version?: unknown;
    };
    const version = typeof body.serverVersion === "string"
      ? body.serverVersion
      : typeof body.version === "string"
        ? body.version
        : null;
    return { ok: response.ok && body.status === "ok", version };
  } catch (error) {
    return { ok: false, version: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function serviceHealthChecks(
  config: ThinkingMachConfig,
  dependencies: Partial<ServiceCheckDependencies> = {},
): Promise<CheckResult[]> {
  if (process.env.THINKINGMACH_SERVICE_MANAGED === "1") return [];

  const deps: ServiceCheckDependencies = {
    detect: (instanceId) => detectServiceManager({ instanceId }),
    probe: probeHealth,
    shimPresent: (executablePath) => isExecutableFile(executablePath),
    ...dependencies,
  };
  const instanceId = resolveThinkingMachInstanceId();
  const detection = await deps.detect(instanceId);
  if (!detection.supported) {
    return [{ name: "Background service", status: "pass", message: detection.reason }];
  }

  const manager = detection.manager;
  const status = await manager.status();
  if (!status.installed) {
    return [
      {
        name: "Background service",
        status: "pass",
        message: `Not installed for instance ${instanceId} (optional)`,
      },
    ];
  }

  const results: CheckResult[] = [];
  let definitionCurrent = false;
  try {
    definitionCurrent = (await fs.readFile(manager.definitionPath, "utf8")) === manager.renderDefinition();
  } catch {
    definitionCurrent = false;
  }
  results.push(
    definitionCurrent
      ? { name: "Service definition", status: "pass", message: manager.definitionPath }
      : {
          name: "Service definition",
          status: "fail",
          message: `Missing or drifted definition at ${manager.definitionPath}`,
          repairHint: "Run `thinkingmach service install` to regenerate the service definition",
        },
  );

  const health = await deps.probe(config);
  // The installed definition is the truth about what the service executes;
  // fall back to the environment-derived path only when it is unreadable.
  const serviceExecutable = (await manager.installedExecutablePath()) ?? resolveServiceShimPath();
  const shimPresent = status.active ? true : await deps.shimPresent(serviceExecutable);
  results.push(
    status.active
      ? { name: "Service runtime", status: "pass", message: `${status.serviceName} is active` }
      : !shimPresent
        ? {
            name: "Service runtime",
            status: "fail",
            message: `${status.serviceName} cannot start: no executable exists at ${serviceExecutable}`,
            repairHint:
              path.resolve(serviceExecutable) === path.resolve(resolveInstallStorePaths().shimPath)
                ? "Run `thinkingmach install` to restore the managed payload and shim, then `thinkingmach service start`"
                : `Restore the executable at ${serviceExecutable}, or unset THINKINGMACH_SHIM_PATH and run \`thinkingmach install\` followed by \`thinkingmach service install\` to re-point the service at the managed shim`,
          }
        : health.ok
          ? {
              name: "Service runtime",
              status: "fail",
              message: `${status.serviceName} is inactive but the configured port is serving another ThinkingMach process`,
              repairHint: "Run `thinkingmach service start`, or stop the conflicting foreground process first",
            }
          : {
              name: "Service runtime",
              status: "fail",
              message: `${status.serviceName} is ${status.detail ?? "inactive"}`,
              repairHint: "Run `thinkingmach service start`; inspect `thinkingmach service logs` if it does not stay up",
            },
  );

  let expectedVersion: string | null = null;
  try {
    expectedVersion = readInstallManifest()?.version ?? null;
  } catch {}
  results.push(
    !health.ok
      ? {
          name: "Service health",
          status: "fail",
          message: health.error ?? "Health endpoint did not report ok",
          repairHint: "Inspect `thinkingmach service status` and `thinkingmach service logs`",
        }
      : expectedVersion && health.version !== expectedVersion
        ? {
            name: "Service version",
            status: "fail",
            message: `Running ${health.version ?? "unknown"}; managed install is ${expectedVersion}`,
            repairHint: "Run `thinkingmach service restart --expected-version " + expectedVersion + "`",
          }
        : status.active
          ? {
              name: "Service health",
              status: "pass",
              message: `Healthy${health.version ? ` at version ${health.version}` : ""}`,
            }
          : {
              name: "Service health",
              status: "warn",
              message: `The configured port answers healthy${health.version ? ` (version ${health.version})` : ""}, but not from ${status.serviceName} — the service is inactive`,
            },
  );

  if (status.enabled && status.linger === false) {
    results.push({
      name: "Service linger",
      status: "warn",
      message: "Start-on-login is enabled but systemd user lingering is off",
      repairHint: "Re-run `thinkingmach service install --enable-linger` if the service must survive logout",
    });
  }

  return results;
}
