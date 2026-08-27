import { describe, expect, it } from "vitest";
import { shouldLoadWorkingDirectoryEnv } from "../env-file-policy.js";

describe("working-directory environment loading", () => {
  it("loads a distinct working-directory .env by default", () => {
    expect(shouldLoadWorkingDirectoryEnv({
      cwdEnvExists: true,
      isThinkingMachEnvFile: false,
      env: {},
    })).toBe(true);
  });

  it("does not load the working-directory .env when explicitly disabled", () => {
    expect(shouldLoadWorkingDirectoryEnv({
      cwdEnvExists: true,
      isThinkingMachEnvFile: false,
      env: { THINKINGMACH_DISABLE_CWD_ENV_FILE: "true" },
    })).toBe(false);
  });

  it("does not load the same file twice", () => {
    expect(shouldLoadWorkingDirectoryEnv({
      cwdEnvExists: true,
      isThinkingMachEnvFile: true,
      env: {},
    })).toBe(false);
  });
});
