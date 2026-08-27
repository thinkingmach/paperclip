/**
 * Development shim for the package-local runner runtime.
 *
 * Source-mode server entry points do not build workspace dependencies first,
 * so this shim loads the package source through the TypeScript runtime. The
 * server build replaces the emitted shim with the package's compiled `dist`
 * tree so published server packages have no workspace runtime dependency.
 * Keep server imports pointed at this relative boundary.
 */
type RunnerModule = typeof import("@thinkingmach/paperclip-runner");

export type {
  ThinkingMachJsonValue,
  ThinkingMachQuestionResponse,
  ThinkingMachSemanticActionBinding,
  ThinkingMachSemanticActionId,
  ThinkingMachSemanticAuthorizationRecord,
  ThinkingMachSemanticRunContext,
  ThinkingMachSemanticToolCall,
  ThinkingMachSemanticToolDefinition,
  ThinkingMachSemanticToolResult,
  ThinkingMachRunnerAuthorizedToolSet,
  ThinkingMachQuestionSet,
  ThinkingMachRuntimeInputRequest,
  CompleteControlPlaneRunInput,
  ControlPlanePort,
  HarnessRuntimeRequestKind,
  HarnessRuntimeRequestResolution,
  NativeAcpxAgent,
  NativeAcpxPermissionMode,
  NativeCodexApprovalPolicy,
  NativeExecutionInput,
  NativeExecutionInputV4,
  NativeInteractionResponseEnvelope,
  NativeOpenCodePermissionMode,
  NativePlanningContext,
  NativeRunEvent,
  NativeRunResult,
  NativeRuntimeAssetReference,
  NativeRuntimeContextSnapshot,
  NativeSession,
  NativeSessionBackend,
  OpenControlPlaneRunInput,
  PersistedNativeSession,
  PrpEvent,
  PrpIgnoredAttentionRequest,
  PrpNormalizedAttentionRequest,
  PrpStructuredRunResult,
  PrpTerminalState,
  PrpVerificationReasonCode,
  PrpWireConnection,
  ReplayControlPlaneEventsInput,
  RunnerProcessHandle,
  RunnerProcessLaunchSpec,
  StrictCompletionContractInput,
  TransportCloseReason,
} from "@thinkingmach/paperclip-runner";
export type DurablePrpControlPlane =
  import("@thinkingmach/paperclip-runner").DurablePrpControlPlane;
export type ThinkingMachSemanticDispatcher =
  import("@thinkingmach/paperclip-runner").ThinkingMachSemanticDispatcher;

const sourceUrl = new URL(
  "../../../../packages/paperclip-runner/src/index.ts",
  import.meta.url,
);
const runner = await import(sourceUrl.href) as RunnerModule;

export const DurablePrpControlPlane = runner.DurablePrpControlPlane;
export const ThinkingMachSemanticDispatcher = runner.ThinkingMachSemanticDispatcher;
export const CAPABILITY_SEMANTIC_TOOL_CATALOG =
  runner.CAPABILITY_SEMANTIC_TOOL_CATALOG;
export const HarnessRuntimeRequestResolutionError =
  runner.HarnessRuntimeRequestResolutionError;
export const NATIVE_RUNTIME_ASSET_SCHEMA = runner.NATIVE_RUNTIME_ASSET_SCHEMA;
export const THINKINGMACH_EXECUTION_PROMPT = runner.THINKINGMACH_EXECUTION_PROMPT;
export const THINKINGMACH_EXECUTION_PROMPT_REVISION =
  runner.THINKINGMACH_EXECUTION_PROMPT_REVISION;
export const canonicalNativeRuntimeContextDigest =
  runner.canonicalNativeRuntimeContextDigest;
export const createNativeSessionBackend = runner.createNativeSessionBackend;
export const createThinkingMachRunnerAuthorizedToolSet =
  runner.createThinkingMachRunnerAuthorizedToolSet;
export const createRunnerdCodexTransport: (
  options?: import("@thinkingmach/paperclip-runner").RunnerdCodexTransportOptions,
) => import("@thinkingmach/paperclip-runner").RunnerdCodexTransport =
  runner.createRunnerdCodexTransport;
export const defaultCapabilityRunnerdBinary =
  runner.defaultCapabilityRunnerdBinary;
export const executeNativeSession = runner.executeNativeSession;
export const nativeRuntimePromptDigest = runner.nativeRuntimePromptDigest;
export const normalizePrpResultSignals = runner.normalizePrpResultSignals;
export const parseCodexTurnDiff = runner.parseCodexTurnDiff;
export const parseHarnessRuntimeRequestResolution =
  runner.parseHarnessRuntimeRequestResolution;
export const parseNativeExecutionInput = runner.parseNativeExecutionInput;
export const parseNativeRuntimeContext = runner.parseNativeRuntimeContext;
export const parseThinkingMachQuestionSet = runner.parseThinkingMachQuestionSet;
export const parseThinkingMachQuestionResponse = runner.parseThinkingMachQuestionResponse;
export const resolveQualifiedAcpxProfile = runner.resolveQualifiedAcpxProfile;
export const resolveSourceCodexHome = runner.resolveSourceCodexHome;
export const validatePrpEvent = runner.validatePrpEvent;
export const validatePrpStructuredRunResult =
  runner.validatePrpStructuredRunResult;
