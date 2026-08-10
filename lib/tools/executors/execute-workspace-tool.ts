import "server-only";

import { bienhinhCreateImageInputSchema } from "../schemas/bienhinh-create-image-input-schema";
import { executeBienhinhCreateImageTool } from "./execute-bienhinh-create-image-tool";
import { executeBuiltinTool } from "./execute-builtin-tool";
import { executeHttpApiTool } from "./execute-http-api-tool";
import { executeMcpTool } from "./execute-mcp-tool";
import type { ToolExecutionContext, WorkspaceToolRuntime } from "../types";

export async function executeWorkspaceTool(
  tool: WorkspaceToolRuntime,
  input: Record<string, unknown>,
  executionContext?: ToolExecutionContext,
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
    case "bienhinh_create_image": {
      const parsed = bienhinhCreateImageInputSchema.safeParse(input);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return JSON.stringify({
          error: firstIssue?.message ?? "Invalid create image input.",
        });
      }

      return executeBienhinhCreateImageTool(tool, parsed.data, executionContext);
    }
    default:
      return JSON.stringify({
        error: `Unsupported registry tool: ${tool.registryToolId}`,
      });
  }
}
