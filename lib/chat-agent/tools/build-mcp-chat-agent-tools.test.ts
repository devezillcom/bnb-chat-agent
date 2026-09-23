import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMcpTool } = vi.hoisted(() => ({
  executeMcpTool: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/tools/executors/execute-mcp-tool", () => ({
  executeMcpTool,
}));

import { buildMcpChatAgentTools } from "./build-mcp-chat-agent-tools";
import type { WorkspaceToolRuntime } from "@/lib/tools/types";

const availableTools = [
  {
    name: "search_knowledge",
    description: "Search the knowledge graph",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

const workspaceTool: WorkspaceToolRuntime = {
  slug: "docs_mcp",
  name: "Docs MCP",
  description: "Workspace MCP connection",
  registryToolId: "mcp",
  config: {
    transport: "http",
    server_url: "https://mcp.example.com/mcp",
    available_tools: availableTools,
    selected_tools: ["search_knowledge"],
  },
};

describe("buildMcpChatAgentTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes selected MCP tools by their real names", async () => {
    executeMcpTool.mockResolvedValue(JSON.stringify({ ok: true }));

    const usedNames = new Set<string>(["search_knowledge_base"]);
    const tools = await buildMcpChatAgentTools({
      workspaceTool,
      usedNames,
    });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe("search_knowledge");
    expect(tools[0]?.description).toContain("Search the knowledge graph");
    expect(usedNames.has("search_knowledge")).toBe(true);

    const [searchTool] = tools;
    if (!searchTool) {
      throw new Error("Expected search_knowledge tool.");
    }
    await searchTool.invoke({ query: "check-in" });

    expect(executeMcpTool).toHaveBeenCalledWith(workspaceTool, {
      toolName: "search_knowledge",
      arguments: { query: "check-in" },
    });
  });

  it("returns an unavailable placeholder when no tools are selected", async () => {
    const tools = await buildMcpChatAgentTools({
      workspaceTool: {
        ...workspaceTool,
        config: {
          ...workspaceTool.config,
          selected_tools: [],
        },
      },
      usedNames: new Set<string>(),
    });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.name).toBe("docs_mcp");
    expect(tools[0]?.description).toContain("Do not invent tool names");

    const [unavailableTool] = tools;
    if (!unavailableTool) {
      throw new Error("Expected unavailable MCP placeholder tool.");
    }
    await expect(unavailableTool.invoke({})).resolves.toContain(
      "No MCP tools are selected for this connection.",
    );
  });
});
