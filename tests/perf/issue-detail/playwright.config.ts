import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.THINKINGMACH_ISSUE_PERF_PORT ?? 3201);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const THINKINGMACH_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-issue-perf-home-"));
const THINKINGMACH_INSTANCE_ID = "playwright-issue-perf";
const THINKINGMACH_CONFIG = path.join(THINKINGMACH_HOME, "instances", THINKINGMACH_INSTANCE_ID, "config.json");

process.env.THINKINGMACH_HOME = THINKINGMACH_HOME;
process.env.THINKINGMACH_CONFIG = THINKINGMACH_CONFIG;

export default defineConfig({
  testDir: ".",
  testMatch: "issue-detail.perf.spec.ts",
  timeout: 30 * 60_000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "pnpm thinkingmach onboard --yes --run",
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(PORT),
      THINKINGMACH_OPEN_ON_LISTEN: "false",
      THINKINGMACH_HOME,
      THINKINGMACH_INSTANCE_ID,
      THINKINGMACH_CONFIG,
      THINKINGMACH_AGENT_JWT_SECRET: "playwright-issue-perf-agent-jwt-secret",
      THINKINGMACH_TOOL_ACTION_SIGNING_SECRET: "playwright-issue-perf-tool-action-signing-secret",
      THINKINGMACH_BIND: "loopback",
      THINKINGMACH_DEPLOYMENT_MODE: "local_trusted",
      THINKINGMACH_DEPLOYMENT_EXPOSURE: "private",
    },
  },
  outputDir: "../../../test-results/issue-detail-perf/playwright",
  reporter: [["list"]],
});
