import "server-only";

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import type { McpToolInputJsonSchema } from "./to-mcp-tool-input-schema";
import { withMcpClient } from "./with-mcp-client";

export type McpServerTool = {
  name: string;
  description: string;
  inputSchema: McpToolInputJsonSchema;
};

type ListMcpToolsClient = Pick<Client, "listTools">;

export async function listMcpToolsFromClient(
  client: ListMcpToolsClient,
): Promise<McpServerTool[]> {
  const tools: McpServerTool[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.listTools(
      cursor ? { cursor } : undefined,
    );

    for (const item of response.tools) {
      const name = item.name.trim();
      if (!name) {
        continue;
      }

      tools.push({
        name,
        description: item.description?.trim() ?? "",
        inputSchema: {
          ...item.inputSchema,
          type: "object",
          properties: item.inputSchema.properties ?? {},
        },
      });
    }

    cursor = response.nextCursor;
  } while (cursor);

  return tools;
}

export async function listMcpServerTools(
  config: Record<string, string>,
): Promise<McpServerTool[]> {
  return withMcpClient(config, (client) => listMcpToolsFromClient(client));
}
