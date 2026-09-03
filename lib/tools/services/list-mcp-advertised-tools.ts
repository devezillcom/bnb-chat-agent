import "server-only";

import { APIError } from "@/lib/exposers/api-error";

import { getTool } from "./get-tool";
import { listMcpServerTools } from "../utils/list-mcp-server-tools";
import type {
  ListMcpAdvertisedToolsParams,
  ListMcpAdvertisedToolsResult,
} from "../types";

export async function listMcpAdvertisedTools(
  params: ListMcpAdvertisedToolsParams,
): Promise<ListMcpAdvertisedToolsResult> {
  const tool = await getTool(params);

  if (tool.registryToolId !== "mcp") {
    throw new APIError(
      "ERR_TOOL_NOT_MCP",
      "Advertised tools are only available for MCP connections.",
      400,
    );
  }

  try {
    const mcpTools = await listMcpServerTools(tool.config);

    return {
      items: mcpTools.map((item) => ({
        name: item.name,
        description: item.description,
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
