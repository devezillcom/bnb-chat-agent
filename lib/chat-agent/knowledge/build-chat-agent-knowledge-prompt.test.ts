import { describe, expect, it } from "vitest";

import { buildChatAgentKnowledgePrompt } from "@/lib/chat-agent/knowledge/build-chat-agent-knowledge-prompt";

describe("buildChatAgentKnowledgePrompt", () => {
  it("returns guidance to use search_knowledge_base with citations enabled", () => {
    const prompt = buildChatAgentKnowledgePrompt({
      knowledgeBaseCount: 2,
      citationsEnabled: true,
    });

    expect(prompt).toContain("search_knowledge_base");
    expect(prompt).toContain("rewriteQuery: true");
    expect(prompt).toContain("multiQuery: true");
    expect(prompt).toContain("[filename > section]");
  });

  it("omits citation instructions when citations are disabled", () => {
    const prompt = buildChatAgentKnowledgePrompt({
      knowledgeBaseCount: 1,
      citationsEnabled: false,
    });

    expect(prompt).toContain("search_knowledge_base");
    expect(prompt).not.toContain("[filename > section]");
    expect(prompt).toContain("Do not include source filenames");
  });

  it("returns an empty string when no knowledge bases are assigned", () => {
    expect(
      buildChatAgentKnowledgePrompt({
        knowledgeBaseCount: 0,
        citationsEnabled: true,
      }),
    ).toBe("");
  });
});
