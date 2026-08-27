import fs from "node:fs";
import path from "node:path";
import { resolveDefaultConfigPath } from "./home-paths.js";

const THINKINGMACH_CONFIG_BASENAME = "config.json";
const THINKINGMACH_ENV_FILENAME = ".env";

function findConfigFileFromAncestors(startDir: string): string | null {
  const absoluteStartDir = path.resolve(startDir);
  let currentDir = absoluteStartDir;

  while (true) {
    const candidate = path.resolve(currentDir, ".paperclip", THINKINGMACH_CONFIG_BASENAME);
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const nextDir = path.resolve(currentDir, "..");
    if (nextDir === currentDir) break;
    currentDir = nextDir;
  }

  return null;
}

export function resolveThinkingMachConfigPath(overridePath?: string): string {
  if (overridePath) return path.resolve(overridePath);
  if (process.env.THINKINGMACH_CONFIG) return path.resolve(process.env.THINKINGMACH_CONFIG);
  return findConfigFileFromAncestors(process.cwd()) ?? resolveDefaultConfigPath();
}

export function resolveThinkingMachEnvPath(overrideConfigPath?: string): string {
  return path.resolve(path.dirname(resolveThinkingMachConfigPath(overrideConfigPath)), THINKINGMACH_ENV_FILENAME);
}
