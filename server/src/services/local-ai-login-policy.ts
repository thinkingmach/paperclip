import type { DeploymentMode, DeploymentExposure } from "@thinkingmach/shared";

/** Same server-host boundary as local stdio runtimes. */
export function supportsLocalAiLogin(options: {
  deploymentMode?: DeploymentMode;
  deploymentExposure?: DeploymentExposure;
  trustedLocalStdioRuntimeHost?: string | null;
}) {
  return options.deploymentMode !== "authenticated" || options.deploymentExposure !== "public" || Boolean(
    options.trustedLocalStdioRuntimeHost ?? process.env.THINKINGMACH_TRUSTED_MCP_RUNTIME_HOST ?? process.env.THINKINGMACH_TOOL_RUNTIME_TRUSTED_HOST,
  );
}
