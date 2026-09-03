import "server-only";

import { parseMcpToolArguments } from "../utils/parse-mcp-tool-arguments";
import { withMcpClient } from "../utils/with-mcp-client";
import type { WorkspaceToolRuntime } from "../types";

export type ExecuteMcpToolInput = {
  toolName: string;
  arguments?: Record<string, unknown> | string;
};

function toErrorResult(message: string, extra?: Record<string, unknown>): string {
  return JSON.stringify({
    error: message,
    ...extra,
  });
}

export async function executeMcpTool(
  tool: WorkspaceToolRuntime,
  input: ExecuteMcpToolInput,
): Promise<string> {
  const toolName = input.toolName.trim();
  if (!toolName) {
    return toErrorResult("MCP tool name is required.");
  }

  try {
    const result = await withMcpClient(tool.config, (client) =>
      client.callTool({
        name: toolName,
        arguments: parseMcpToolArguments(input.arguments),
      }),
    );

    return JSON.stringify(result);
  } catch (error) {
    return toErrorResult(
      error instanceof Error ? error.message : "MCP tool execution failed.",
    );
  }
}
