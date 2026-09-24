import "server-only";

import type { ToolRuntimeHandlers } from "../registry-runtime-types";
import { buildMcpChatAgentTools } from "./build-chat-agent-tools";
import { executeMcpTool } from "./execute-tool";
import { parseMcpToolArguments } from "./utils/parse-mcp-tool-arguments";

export const mcpToolRuntime: ToolRuntimeHandlers = {
  buildChatAgentTools: buildMcpChatAgentTools,
  async execute({ tool, input }) {
    return executeMcpTool(tool, {
      toolName: String(input.tool_name ?? input.toolName ?? ""),
      arguments: parseMcpToolArguments(input.arguments),
    });
  },
};
