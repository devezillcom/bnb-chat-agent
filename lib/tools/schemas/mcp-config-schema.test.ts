import { describe, expect, it } from "vitest";

import { mcpConfigSchema } from "./mcp-config-schema";
import { toMcpRuntimeConfig } from "../utils/to-mcp-runtime-config";

const availableTools = [
  {
    name: "search_knowledge",
    description: "Search the knowledge graph",
    inputSchema: { type: "object", properties: {} },
  },
];

const validMcpToolSelection = {
  available_tools: availableTools,
  selected_tools: ["search_knowledge"],
};

describe("mcpConfigSchema", () => {
  it("defaults missing transport and auth for existing server_url configs", () => {
    const result = mcpConfigSchema.safeParse({
      server_url: "https://mcp.example.com/mcp",
      ...validMcpToolSelection,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      transport: "http",
      auth_type: "none",
      server_url: "https://mcp.example.com/mcp",
      bearer_token: "",
      command: "",
      available_tools: availableTools,
      selected_tools: ["search_knowledge"],
    });
  });

  it("requires a valid server URL for HTTP transport", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "http",
      server_url: "not-a-url",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe("Server URL must be valid.");
  });

  it("requires a command for stdio transport", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "stdio",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe(
      "Command is required for stdio transport.",
    );
  });

  it("does not require a bearer token for stdio even if auth type is leftover", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "stdio",
      command: "npx",
      auth_type: "bearer",
      bearer_token: "",
      ...validMcpToolSelection,
    });

    expect(result.success).toBe(true);
  });

  it("requires a bearer token when auth type is bearer", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "http",
      server_url: "https://mcp.example.com/mcp",
      auth_type: "bearer",
      bearer_token: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe(
      "Bearer token is required when auth type is bearer.",
    );
  });

  it("accepts a full stdio config with JSON args and env", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "stdio",
      command: "npx",
      args: '["-y", "@modelcontextprotocol/server-github"]',
      env: "GITHUB_PERSONAL_ACCESS_TOKEN=ghp_example",
      cwd: "/tmp/mcp",
      ...validMcpToolSelection,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(toMcpRuntimeConfig(result.data)).toEqual({
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_example" },
      cwd: "/tmp/mcp",
    });
  });

  it("builds Authorization from a bearer token and extra headers", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "sse",
      server_url: "https://mcp.example.com/sse",
      auth_type: "bearer",
      bearer_token: "secret-token",
      headers: "X-API-Key=abc",
      ...validMcpToolSelection,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(toMcpRuntimeConfig(result.data)).toEqual({
      transport: "sse",
      serverUrl: "https://mcp.example.com/sse",
      authType: "bearer",
      bearerToken: "secret-token",
      headers: {
        "X-API-Key": "abc",
        Authorization: "Bearer secret-token",
      },
    });
  });

  it("requires at least one selected MCP tool", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "http",
      server_url: "https://mcp.example.com/mcp",
      selected_tools: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe(
      "Select at least one MCP tool.",
    );
  });

  it("stores available tools as objects and selected tools as names", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "http",
      server_url: "https://mcp.example.com/mcp",
      ...validMcpToolSelection,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.available_tools).toEqual(availableTools);
    expect(result.data.selected_tools).toEqual(["search_knowledge"]);
  });

  it("rejects selected tool names that are not available", () => {
    const result = mcpConfigSchema.safeParse({
      transport: "http",
      server_url: "https://mcp.example.com/mcp",
      available_tools: availableTools,
      selected_tools: ["missing_tool"],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.error.issues[0]?.message).toBe(
      'Selected tool "missing_tool" is not in available tools.',
    );
  });
});
