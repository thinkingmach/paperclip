import {
  NATIVE_RUNTIME_ASSET_SCHEMA,
  THINKINGMACH_EXECUTION_PROMPT,
  THINKINGMACH_EXECUTION_PROMPT_REVISION,
  canonicalNativeRuntimeContextDigest,
  nativeRuntimePromptDigest,
  type NativeRuntimeContextSnapshot,
} from "../../vendor/paperclip-runner/index.js";

export function nativeRuntimeContextFixture(): NativeRuntimeContextSnapshot {
  const digest = "0".repeat(64);
  const context = {
    prompt: {
      revision: THINKINGMACH_EXECUTION_PROMPT_REVISION,
      text: THINKINGMACH_EXECUTION_PROMPT,
      digest: nativeRuntimePromptDigest(),
    },
    instructions: {
      entryPath: "AGENTS.md",
      bundle: {
        schema: NATIVE_RUNTIME_ASSET_SCHEMA,
        digest,
        manifestDigest: digest,
        rootPath: "/tmp/paperclip-runtime-context-fixture",
        fileCount: 1,
        totalBytes: 1,
      },
    },
    skills: [],
    mcp: { assignmentSetId: "none", digest, bindingId: null },
  } satisfies Omit<NativeRuntimeContextSnapshot, "aggregateDigest">;
  return { ...context, aggregateDigest: canonicalNativeRuntimeContextDigest(context) };
}
