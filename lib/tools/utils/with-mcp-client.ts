import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { mcpConnectionConfigSchema } from "../schemas/mcp-config-schema";
import { createMcpClientTransport } from "./create-mcp-client-transport";
import { toMcpRuntimeConfig } from "./to-mcp-runtime-config";

const MCP_CLIENT_INFO = {
  name: "bnb-chat-agent",
  version: "0.1.0",
} as const;

export async function withMcpClient<T>(
  config: Record<string, unknown>,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const parsedConfig = mcpConnectionConfigSchema.safeParse(config);
  if (!parsedConfig.success) {
    throw new Error(
      parsedConfig.error.issues[0]?.message ?? "Invalid MCP tool configuration.",
    );
  }

  const client = new Client(MCP_CLIENT_INFO);

  try {
    await client.connect(
      createMcpClientTransport(toMcpRuntimeConfig(parsedConfig.data)),
    );
    return await run(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}
