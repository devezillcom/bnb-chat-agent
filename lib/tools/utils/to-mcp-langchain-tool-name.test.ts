import { describe, expect, it } from "vitest";

import {
  allocateLangChainToolName,
  LANGCHAIN_TOOL_NAME_MAX_LENGTH,
  sanitizeLangChainToolName,
} from "./to-mcp-langchain-tool-name";

describe("sanitizeLangChainToolName", () => {
  it("keeps valid MCP tool names", () => {
    expect(sanitizeLangChainToolName("search_knowledge")).toBe(
      "search_knowledge",
    );
  });

  it("replaces invalid characters", () => {
    expect(sanitizeLangChainToolName("project overview")).toBe(
      "project_overview",
    );
  });

  it("falls back when the name is empty", () => {
    expect(sanitizeLangChainToolName("   ")).toBe("mcp_tool");
  });
});

describe("allocateLangChainToolName", () => {
  it("uses the MCP tool name when it is unique", () => {
    const usedNames = new Set<string>(["search_knowledge_base"]);

    expect(allocateLangChainToolName("search_knowledge", usedNames)).toBe(
      "search_knowledge",
    );
    expect(usedNames.has("search_knowledge")).toBe(true);
  });

  it("prefixes with the workspace slug on collision", () => {
    const usedNames = new Set<string>(["search_knowledge"]);

    expect(
      allocateLangChainToolName("search_knowledge", usedNames, "docs_mcp"),
    ).toBe("docs_mcp__search_knowledge");
  });

  it("appends a numeric suffix when the prefixed name is also taken", () => {
    const usedNames = new Set<string>([
      "search_knowledge",
      "docs_mcp__search_knowledge",
    ]);

    expect(
      allocateLangChainToolName("search_knowledge", usedNames, "docs_mcp"),
    ).toBe("docs_mcp__search_knowledge_2");
  });

  it("stays within the LangChain tool name length limit", () => {
    const usedNames = new Set<string>();
    const longName = "a".repeat(LANGCHAIN_TOOL_NAME_MAX_LENGTH + 12);

    expect(allocateLangChainToolName(longName, usedNames).length).toBe(
      LANGCHAIN_TOOL_NAME_MAX_LENGTH,
    );
  });
});
