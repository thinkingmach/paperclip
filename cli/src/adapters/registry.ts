import type { CLIAdapterModule } from "@thinkingmach/adapter-utils";
import { printClaudeStreamEvent } from "@thinkingmach/adapter-claude-local/cli";
import { printCodexStreamEvent } from "@thinkingmach/adapter-codex-local/cli";
import { printCursorStreamEvent } from "@thinkingmach/adapter-cursor-local/cli";
import { printCursorCloudEvent } from "@thinkingmach/adapter-cursor-cloud/cli";
import { printGeminiStreamEvent } from "@thinkingmach/adapter-gemini-local/cli";
import { printGrokStreamEvent } from "@thinkingmach/adapter-grok-local/cli";
import { printKimiStreamEvent } from "@thinkingmach/adapter-kimi-local/cli";
import { formatStdoutEvent as printHermesGatewayStreamEvent } from "@thinkingmach/hermes-paperclip-adapter/gateway/cli";
import { printHermesStreamEvent } from "@thinkingmach/hermes-paperclip-adapter/cli";
import { printOpenCodeStreamEvent } from "@thinkingmach/adapter-opencode-local/cli";
import { printPiStreamEvent } from "@thinkingmach/adapter-pi-local/cli";
import { printOpenClawGatewayStreamEvent } from "@thinkingmach/adapter-openclaw-gateway/cli";
import { processCLIAdapter } from "./process/index.js";
import { httpCLIAdapter } from "./http/index.js";

const claudeLocalCLIAdapter: CLIAdapterModule = {
  type: "claude_local",
  formatStdoutEvent: printClaudeStreamEvent,
};

const codexLocalCLIAdapter: CLIAdapterModule = {
  type: "codex_local",
  formatStdoutEvent: printCodexStreamEvent,
};

const openCodeLocalCLIAdapter: CLIAdapterModule = {
  type: "opencode_local",
  formatStdoutEvent: printOpenCodeStreamEvent,
};

const piLocalCLIAdapter: CLIAdapterModule = {
  type: "pi_local",
  formatStdoutEvent: printPiStreamEvent,
};

const cursorLocalCLIAdapter: CLIAdapterModule = {
  type: "cursor",
  formatStdoutEvent: printCursorStreamEvent,
};

const cursorCloudCLIAdapter: CLIAdapterModule = {
  type: "cursor_cloud",
  formatStdoutEvent: printCursorCloudEvent,
};

const geminiLocalCLIAdapter: CLIAdapterModule = {
  type: "gemini_local",
  formatStdoutEvent: printGeminiStreamEvent,
};

const grokLocalCLIAdapter: CLIAdapterModule = {
  type: "grok_local",
  formatStdoutEvent: printGrokStreamEvent,
};

const kimiLocalCLIAdapter: CLIAdapterModule = {
  type: "kimi_local",
  formatStdoutEvent: printKimiStreamEvent,
};

const hermesGatewayCLIAdapter: CLIAdapterModule = {
  type: "hermes_gateway",
  formatStdoutEvent: printHermesGatewayStreamEvent,
};

const hermesLocalCLIAdapter: CLIAdapterModule = {
  type: "hermes_local",
  formatStdoutEvent: printHermesStreamEvent,
};

const openclawGatewayCLIAdapter: CLIAdapterModule = {
  type: "openclaw_gateway",
  formatStdoutEvent: printOpenClawGatewayStreamEvent,
};

const adaptersByType = new Map<string, CLIAdapterModule>(
  [
    claudeLocalCLIAdapter,
    codexLocalCLIAdapter,
    openCodeLocalCLIAdapter,
    piLocalCLIAdapter,
    cursorLocalCLIAdapter,
    cursorCloudCLIAdapter,
    geminiLocalCLIAdapter,
    grokLocalCLIAdapter,
    kimiLocalCLIAdapter,
    hermesGatewayCLIAdapter,
    hermesLocalCLIAdapter,
    openclawGatewayCLIAdapter,
    processCLIAdapter,
    httpCLIAdapter,
  ].map((a) => [a.type, a]),
);

export function getCLIAdapter(type: string): CLIAdapterModule {
  return adaptersByType.get(type) ?? processCLIAdapter;
}
