import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ThinkingMachApiClient } from "./client.js";
import { readConfigFromEnv, type ThinkingMachMcpConfig } from "./config.js";
import { createToolDefinitions } from "./tools.js";

export function createThinkingMachMcpServer(config: ThinkingMachMcpConfig = readConfigFromEnv()) {
  const server = new McpServer({
    name: "paperclip",
    version: "0.1.0",
  });

  const client = new ThinkingMachApiClient(config);
  const tools = createToolDefinitions(client);
  for (const tool of tools) {
    server.tool(tool.name, tool.description, tool.schema.shape, tool.execute);
  }

  return {
    server,
    tools,
    client,
  };
}

export async function runServer(config: ThinkingMachMcpConfig = readConfigFromEnv()) {
  const { server } = createThinkingMachMcpServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
