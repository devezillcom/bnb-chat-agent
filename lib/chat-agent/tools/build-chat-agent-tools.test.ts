import { beforeEach, describe, expect, it, vi } from "vitest";

const { listToolsBySlugs, buildMcpChatAgentTools } = vi.hoisted(() => ({
  listToolsBySlugs: vi.fn(),
  buildMcpChatAgentTools: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/tools/services/list-tools-by-slugs", () => ({
  listToolsBySlugs,
}));
vi.mock("@/lib/tools/executors/execute-workspace-tool", () => ({
  executeWorkspaceTool: vi.fn(),
}));
vi.mock("./build-mcp-chat-agent-tools", () => ({
  buildMcpChatAgentTools,
}));

import { tool } from "langchain";
import { z } from "zod";

import { buildChatAgentTools } from "./build-chat-agent-tools";

describe("buildChatAgentTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expands MCP workspace tools instead of exposing a generic tool_name wrapper", async () => {
    listToolsBySlugs.mockResolvedValue([
      {
        slug: "docs_mcp",
        name: "Docs MCP",
        description: "Workspace MCP connection",
        registryToolId: "mcp",
        config: { server_url: "https://mcp.example.com/mcp" },
      },
      {
        slug: "http_api",
        name: "HTTP API",
        description: "Call an API",
        registryToolId: "http_api",
        config: { base_url: "https://example.com", api_key: "secret" },
      },
    ]);
    buildMcpChatAgentTools.mockResolvedValue([
      tool(async () => "ok", {
        name: "search_knowledge",
        description: "Search the knowledge graph",
        schema: z.object({ query: z.string() }),
      }),
    ]);

    const tools = await buildChatAgentTools({
      workspaceId: "11111111-1111-4111-8111-111111111111",
      toolSlugs: ["docs_mcp", "http_api"],
    });

    expect(buildMcpChatAgentTools).toHaveBeenCalledTimes(1);
    expect(tools.map((item) => item.name)).toEqual([
      "search_knowledge",
      "http_api",
    ]);
    expect(tools.map((item) => item.name)).not.toContain("docs_mcp");
  });
});
