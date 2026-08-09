import "server-only";

import { executeBuiltinTool } from "./execute-builtin-tool";
import { executeHttpApiTool } from "./execute-http-api-tool";
import { executeMcpTool } from "./execute-mcp-tool";
import type { WorkspaceToolRuntime } from "../types";

export async function executeWorkspaceTool(
  tool: WorkspaceToolRuntime,
  input: Record<string, unknown>,
): Promise<string> {
  switch (tool.registryToolId) {
    case "http_api":
      return executeHttpApiTool(tool, {
        method: String(input.method ?? ""),
        path: String(input.path ?? ""),
        body: input.body == null ? undefined : String(input.body),
      });
    case "mcp":
      return executeMcpTool(tool, {
        tool_name: String(input.tool_name ?? ""),
        arguments: input.arguments == null ? undefined : String(input.arguments),
      });
    case "builtin":
      return executeBuiltinTool({
        query: String(input.query ?? ""),
      });
    default:
      return JSON.stringify({
        error: `Unsupported registry tool: ${tool.registryToolId}`,
      });
  }
}
