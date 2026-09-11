import { beforeEach, describe, expect, it, vi } from "vitest";

const { listToolsBySlugs, buildMcpChatAgentTools, buildWebChatAgentTools } =
  vi.hoisted(() => ({
    listToolsBySlugs: vi.fn(),
    buildMcpChatAgentTools: vi.fn(),
    buildWebChatAgentTools: vi.fn(),
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
vi.mock("./build-web-chat-agent-tools", () => ({
  buildWebChatAgentTools,
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

  it("expands web_research workspace tools into web_search and web_get_content", async () => {
    listToolsBySlugs.mockResolvedValue([
      {
        slug: "company_web",
        name: "Company web",
        description: "Search the public web",
        registryToolId: "web_research",
        config: { exclude_domains: "example.com" },
      },
    ]);
    buildWebChatAgentTools.mockReturnValue([
      tool(async () => "search", {
        name: "web_search",
        description: "Search the web",
        schema: z.object({ query: z.string() }),
      }),
      tool(async () => "content", {
        name: "web_get_content",
        description: "Fetch page content",
        schema: z.object({ url: z.string() }),
      }),
    ]);

    const tools = await buildChatAgentTools({
      workspaceId: "11111111-1111-4111-8111-111111111111",
      toolSlugs: ["company_web"],
    });

    expect(buildWebChatAgentTools).toHaveBeenCalledTimes(1);
    expect(tools.map((item) => item.name)).toEqual([
      "web_search",
      "web_get_content",
    ]);
    expect(tools.map((item) => item.name)).not.toContain("company_web");
  });
});
