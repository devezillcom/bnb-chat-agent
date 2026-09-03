import { beforeEach, describe, expect, it, vi } from "vitest";

const { getTool, listMcpServerTools } = vi.hoisted(() => ({
  getTool: vi.fn(),
  listMcpServerTools: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./get-tool", () => ({ getTool }));
vi.mock("../utils/list-mcp-server-tools", () => ({
  listMcpServerTools,
}));

import { APIError } from "@/lib/exposers/api-error";

import { listMcpAdvertisedTools } from "./list-mcp-advertised-tools";

describe("listMcpAdvertisedTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns advertised MCP tool names for prompt authors", async () => {
    getTool.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      registryToolId: "mcp",
      config: { server_url: "https://mcp.example.com/mcp" },
    });
    listMcpServerTools.mockResolvedValue([
      {
        name: "search_knowledge",
        description: "Search the knowledge graph",
        inputSchema: { type: "object", properties: {} },
      },
    ]);

    await expect(
      listMcpAdvertisedTools({
        workspaceId: "22222222-2222-4222-8222-222222222222",
        toolId: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toEqual({
      items: [
        {
          name: "search_knowledge",
          description: "Search the knowledge graph",
        },
      ],
    });
  });

  it("rejects non-MCP workspace tools", async () => {
    getTool.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      registryToolId: "http_api",
      config: {},
    });

    await expect(
      listMcpAdvertisedTools({
        workspaceId: "22222222-2222-4222-8222-222222222222",
        toolId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toBeInstanceOf(APIError);
  });
});
