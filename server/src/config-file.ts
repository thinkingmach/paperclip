import fs from "node:fs";
import {
  findThinkingMachConfigKeyWarnings,
  paperclipConfigSchema,
  type ThinkingMachConfig,
} from "@thinkingmach/shared";
import { ZodError } from "zod";
import { resolveThinkingMachConfigPath } from "./paths.js";

function formatConfigValidationError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const issuePath = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `${issuePath}: ${issue.message}`;
    })
    .join("; ");
}

export function readConfigFile(): ThinkingMachConfig | null {
  const configPath = resolveThinkingMachConfigPath();

  if (!fs.existsSync(configPath)) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ThinkingMach config at ${configPath}: failed to read or parse JSON: ${reason}`);
  }

  try {
    const config = paperclipConfigSchema.parse(raw);
    for (const warning of findThinkingMachConfigKeyWarnings(config)) {
      console.warn(
        `Unknown config key ${warning.path}; did you mean ${warning.suggestion}? It will be preserved.`,
      );
    }
    return config;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid ThinkingMach config at ${configPath}: ${formatConfigValidationError(error)}`);
    }

    throw error;
  }
}
