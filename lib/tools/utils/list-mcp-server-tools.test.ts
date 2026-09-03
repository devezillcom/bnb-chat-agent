import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listMcpToolsFromClient } from "./list-mcp-server-tools";

describe("listMcpToolsFromClient", () => {
  it("pages through listTools and skips blank names", async () => {
    const listTools = vi
      .fn()
      .mockResolvedValueOnce({
        tools: [
          {
            name: "search_knowledge",
            description: "Search indexed docs",
            inputSchema: {
              type: "object",
              properties: { query: { type: "string" } },
              required: ["query"],
            },
          },
          {
            name: "  ",
            description: "ignored",
            inputSchema: { type: "object" },
          },
        ],
        nextCursor: "page-2",
      })
      .mockResolvedValueOnce({
        tools: [
          {
            name: "list_sources",
            inputSchema: { type: "object" },
          },
        ],
      });

    await expect(listMcpToolsFromClient({ listTools })).resolves.toEqual([
      {
        name: "search_knowledge",
        description: "Search indexed docs",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
      {
        name: "list_sources",
        description: "",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ]);

    expect(listTools).toHaveBeenCalledTimes(2);
    expect(listTools).toHaveBeenNthCalledWith(1, undefined);
    expect(listTools).toHaveBeenNthCalledWith(2, { cursor: "page-2" });
  });
});
