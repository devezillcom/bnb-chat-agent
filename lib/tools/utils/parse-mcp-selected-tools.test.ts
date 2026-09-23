import { describe, expect, it } from "vitest";

import {
  assertMcpSelectedToolsAvailable,
  parseMcpAvailableTools,
  parseMcpSelectedToolNames,
  parseMcpSelectedToolNamesForSave,
  resolveMcpDisplayTools,
  resolveMcpSelectedTools,
} from "./parse-mcp-selected-tools";

const sampleTool = {
  name: "search_knowledge",
  description: "Search the knowledge graph",
  inputSchema: {
    type: "object" as const,
    properties: { query: { type: "string" } },
  },
};

describe("parseMcpAvailableTools", () => {
  it("returns an empty array for non-array values", () => {
    expect(parseMcpAvailableTools(undefined)).toEqual([]);
    expect(parseMcpAvailableTools("")).toEqual([]);
    expect(parseMcpAvailableTools(JSON.stringify([sampleTool]))).toEqual([]);
  });

  it("parses available tools from arrays", () => {
    expect(parseMcpAvailableTools([sampleTool])).toEqual([sampleTool]);
  });
});

describe("parseMcpSelectedToolNames", () => {
  it("returns an empty array for non-array values", () => {
    expect(parseMcpSelectedToolNames(undefined)).toEqual([]);
    expect(parseMcpSelectedToolNames([sampleTool])).toEqual([]);
  });

  it("parses selected tool names from string arrays", () => {
    expect(parseMcpSelectedToolNames(["search_knowledge"])).toEqual([
      "search_knowledge",
    ]);
  });
});

describe("resolveMcpSelectedTools", () => {
  it("resolves selected names against available tools", () => {
    expect(
      resolveMcpSelectedTools({
        available_tools: [sampleTool],
        selected_tools: ["search_knowledge"],
      }),
    ).toEqual([sampleTool]);
  });

  it("ignores selected names that are not available", () => {
    expect(
      resolveMcpSelectedTools({
        available_tools: [sampleTool],
        selected_tools: ["missing_tool"],
      }),
    ).toEqual([]);
  });
});

describe("resolveMcpDisplayTools", () => {
  it("uses available_tools only", () => {
    expect(
      resolveMcpDisplayTools({
        available_tools: [sampleTool],
      }),
    ).toEqual([sampleTool]);
  });
});

describe("parseMcpSelectedToolNamesForSave", () => {
  it("requires at least one selected tool name", () => {
    expect(() => parseMcpSelectedToolNamesForSave(undefined)).toThrow(
      "Select at least one MCP tool.",
    );
    expect(() => parseMcpSelectedToolNamesForSave([])).toThrow(
      "Select at least one MCP tool.",
    );
  });

  it("returns validated selected tool names", () => {
    expect(parseMcpSelectedToolNamesForSave(["search_knowledge"])).toEqual([
      "search_knowledge",
    ]);
  });
});

describe("assertMcpSelectedToolsAvailable", () => {
  it("throws when a selected name is missing from available tools", () => {
    expect(() =>
      assertMcpSelectedToolsAvailable({
        available_tools: [sampleTool],
        selected_tools: ["missing_tool"],
      }),
    ).toThrow('Selected tool "missing_tool" is not in available tools.');
  });
});
