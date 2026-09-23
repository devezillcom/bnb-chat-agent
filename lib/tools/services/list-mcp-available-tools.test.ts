import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMcpServerTools } = vi.hoisted(() => ({
  listMcpServerTools: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../utils/list-mcp-server-tools", () => ({
  listMcpServerTools,
}));

import { APIError } from "@/lib/exposers/api-error";

import { listMcpAvailableTools } from "./list-mcp-available-tools";

describe("listMcpAvailableTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available MCP tools from the provided config", async () => {
    listMcpServerTools.mockResolvedValue([
      {
        name: "search_knowledge",
        description: "Search the knowledge graph",
        inputSchema: { type: "object", properties: {} },
      },
    ]);

    await expect(
      listMcpAvailableTools({
        config: {
          transport: "http",
          server_url: "https://mcp.example.com/mcp",
        },
      }),
    ).resolves.toEqual({
      items: [
        {
          name: "search_knowledge",
          description: "Search the knowledge graph",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    });
  });

  it("rejects invalid MCP connection config", async () => {
    await expect(
      listMcpAvailableTools({
        config: {
          transport: "http",
          server_url: "not-a-url",
        },
      }),
    ).rejects.toBeInstanceOf(APIError);
  });
});
