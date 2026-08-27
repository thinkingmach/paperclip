import { describe, expect, it } from "vitest";
import {
  normalizeThinkingMachOperationalSkillPreference,
  normalizeThinkingMachRunnerAdapterConfig,
  THINKINGMACH_OPERATIONAL_SKILL_KEY,
  resolveLegacyThinkingMachDesiredSkillNames,
} from "@thinkingmach/adapter-utils/server-utils";

const legacyConfig = {
  paperclipSkillSync: {
    desiredSkills: [THINKINGMACH_OPERATIONAL_SKILL_KEY],
  },
};

describe("paperclip_runner operational skill normalization", () => {
  it("applies full-auto native runner defaults at persistence boundaries", () => {
    expect(normalizeThinkingMachRunnerAdapterConfig("paperclip_runner", {})).toEqual({
      provider: "codex",
      model: "gpt-5.6-sol",
      codexPermissionMode: "never",
      lifecycleMode: "per_turn",
    });
  });

  it("repairs an existing blank model without replacing an explicit model", () => {
    expect(normalizeThinkingMachRunnerAdapterConfig("paperclip_runner", { model: "" }))
      .toMatchObject({ model: "gpt-5.6-sol" });
    expect(normalizeThinkingMachRunnerAdapterConfig("paperclip_runner", { model: "gpt-5.5" }))
      .toMatchObject({ model: "gpt-5.5" });
  });

  it("does not replace a non-Codex provider model with the Codex default", () => {
    expect(normalizeThinkingMachRunnerAdapterConfig("paperclip_runner", {
      provider: "claude_managed",
      model: "claude-sonnet-5",
    })).toMatchObject({
      provider: "claude_managed",
      model: "claude-sonnet-5",
    });
  });

  it("removes the legacy operational skill while preserving optional skills", () => {
    const normalized = normalizeThinkingMachOperationalSkillPreference("paperclip_runner", {
      paperclipSkillSync: {
        desiredSkills: [THINKINGMACH_OPERATIONAL_SKILL_KEY, "company-1/reviewer"],
      },
    });

    expect(normalized).toEqual({
      paperclipSkillSync: { desiredSkills: ["company-1/reviewer"] },
    });
  });

  it("restores the required operational skill through the legacy resolver after switching back", () => {
    const normalized = normalizeThinkingMachOperationalSkillPreference("paperclip_runner", legacyConfig);
    expect(resolveLegacyThinkingMachDesiredSkillNames(normalized, [{
      key: THINKINGMACH_OPERATIONAL_SKILL_KEY,
      runtimeName: "paperclip",
    }])).toEqual([THINKINGMACH_OPERATIONAL_SKILL_KEY]);
  });

  it("does not change direct adapter preferences", () => {
    expect(normalizeThinkingMachOperationalSkillPreference("codex_local", legacyConfig)).toBe(legacyConfig);
  });
});
