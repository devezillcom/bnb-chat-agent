import { describe, expect, it } from "vitest";

import { buildChatAgentToolsPrompt } from "./build-chat-agent-tools-prompt";

describe("buildChatAgentToolsPrompt", () => {
  it("returns an empty string when the agent has no tools", () => {
    expect(buildChatAgentToolsPrompt([])).toBe("");
  });

  it("lists exact runtime tool names for prompt and skill authors", () => {
    const prompt = buildChatAgentToolsPrompt([
      {
        name: "search_knowledge",
        description: "Search the knowledge graph MCP server: Docs MCP.",
      },
      {
        name: "http_api",
        description: "Call an external HTTP API.",
      },
    ] as never);

    expect(prompt).toContain("Call tools by these exact names:");
    expect(prompt).toContain("`search_knowledge`");
    expect(prompt).toContain("`http_api`");
    expect(prompt).not.toContain("docs_mcp");
  });
});
