import { describe, expect, it } from "vitest";

import {
  THINKINGMACH_RUNNER_DEFAULT_MODELS,
  isThinkingMachRunnerProvider,
  resolveThinkingMachRunnerModel,
  resolveThinkingMachRunnerPermissionMode,
} from "./paperclip-runner-permissions.js";

describe("ThinkingMach Runner permission defaults", () => {
  it("defaults Codex to the only qualified non-interactive mode", () => {
    expect(resolveThinkingMachRunnerPermissionMode("codex", undefined)).toBe(
      "never",
    );
    expect(resolveThinkingMachRunnerPermissionMode("codex", "on-request")).toBe("never");
    expect(resolveThinkingMachRunnerPermissionMode("codex", "untrusted")).toBe("never");
  });

  it("uses interactive defaults for dormant non-Codex providers", () => {
    expect(resolveThinkingMachRunnerPermissionMode("opencode", undefined)).toBe(
      "ask",
    );
    expect(resolveThinkingMachRunnerPermissionMode("acpx", undefined)).toBe(
      "approve-reads",
    );
  });

  it("recognizes only exact provider identifiers", () => {
    expect(isThinkingMachRunnerProvider("codex")).toBe(true);
    expect(isThinkingMachRunnerProvider("opencode")).toBe(true);
    expect(isThinkingMachRunnerProvider("claude_managed")).toBe(true);
    expect(isThinkingMachRunnerProvider("aws_agentcore")).toBe(true);
    expect(isThinkingMachRunnerProvider("acpx")).toBe(true);
    expect(isThinkingMachRunnerProvider("toString")).toBe(false);
    expect(isThinkingMachRunnerProvider("__proto__")).toBe(false);
  });

  it("keeps managed provider permissions under the qualified profile", () => {
    expect(resolveThinkingMachRunnerPermissionMode("claude_managed", "never"))
      .toBe("provider-managed");
    expect(resolveThinkingMachRunnerPermissionMode("aws_agentcore", "approve-all"))
      .toBe("provider-managed");
  });

  it("uses the Codex default for missing or blank models", () => {
    expect(resolveThinkingMachRunnerModel("codex", undefined)).toBe(
      THINKINGMACH_RUNNER_DEFAULT_MODELS.codex,
    );
    expect(resolveThinkingMachRunnerModel("codex", "   ")).toBe(
      THINKINGMACH_RUNNER_DEFAULT_MODELS.codex,
    );
  });

  it("preserves an explicit Codex model", () => {
    expect(resolveThinkingMachRunnerModel("codex", "gpt-5.5")).toBe("gpt-5.5");
    expect(resolveThinkingMachRunnerModel("codex", "  gpt-5.5  ")).toBe("gpt-5.5");
  });
});
