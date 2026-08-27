import os from "node:os";
import path from "node:path";

export const DEFAULT_THINKINGMACH_INSTANCE_ID = "default";
export const THINKINGMACH_CONFIG_BASENAME = "config.json";
export const THINKINGMACH_ENV_FILENAME = ".env";

const PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;

export function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function resolveThinkingMachHomeDir(homeOverride?: string): string {
  const raw = homeOverride?.trim() || process.env.THINKINGMACH_HOME?.trim();
  if (raw) return path.resolve(expandHomePrefix(raw));
  return path.resolve(os.homedir(), ".paperclip");
}

export function resolveThinkingMachInstanceId(instanceIdOverride?: string): string {
  const raw = instanceIdOverride?.trim() || process.env.THINKINGMACH_INSTANCE_ID?.trim() || DEFAULT_THINKINGMACH_INSTANCE_ID;
  if (!PATH_SEGMENT_RE.test(raw)) {
    throw new Error(`Invalid THINKINGMACH_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

export function resolveThinkingMachInstanceRoot(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachHomeDir(input.homeDir), "instances", resolveThinkingMachInstanceId(input.instanceId));
}

export function resolveThinkingMachInstanceConfigPath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), THINKINGMACH_CONFIG_BASENAME);
}

export function resolveThinkingMachConfigPathForInstance(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return resolveThinkingMachInstanceConfigPath(input);
}

export function resolveThinkingMachEnvPathForConfig(configPath: string): string {
  return path.resolve(path.dirname(configPath), THINKINGMACH_ENV_FILENAME);
}

export function resolveDefaultEmbeddedPostgresDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), "db");
}

export function resolveDefaultLogsDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), "logs");
}

export function resolveDefaultSecretsKeyFilePath(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), "secrets", "master.key");
}

export function resolveDefaultStorageDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), "data", "storage");
}

export function resolveDefaultBackupDir(input: {
  homeDir?: string;
  instanceId?: string;
} = {}): string {
  return path.resolve(resolveThinkingMachInstanceRoot(input), "data", "backups");
}

export function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}
