import "server-only";

import { APIError } from "@/lib/exposers/api-error";

import { mcpConnectionConfigSchema } from "../schemas/config-schema";
import type {
  ListMcpAvailableToolsParams,
  ListMcpAvailableToolsResult,
} from "@/lib/tools/types";
import { listMcpServerTools } from "../utils/list-mcp-server-tools";

export async function listMcpAvailableTools(
  params: ListMcpAvailableToolsParams,
): Promise<ListMcpAvailableToolsResult> {
  const parsedConfig = mcpConnectionConfigSchema.safeParse(params.config);
  if (!parsedConfig.success) {
    throw new APIError(
      "ERR_INVALID_MCP_CONFIG",
      parsedConfig.error.issues[0]?.message ?? "Invalid MCP configuration.",
      400,
    );
  }

  try {
    const mcpTools = await listMcpServerTools(params.config);

    return {
      items: mcpTools.map((item) => ({
        name: item.name,
        description: item.description,
        inputSchema: item.inputSchema,
      })),
    };
  } catch (error) {
    throw new APIError(
      "ERR_MCP_TOOLS_UNAVAILABLE",
      error instanceof Error ? error.message : "Could not list MCP tools.",
      502,
    );
  }
}
