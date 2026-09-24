import { describe, expect, it } from "vitest";

import { buildChatAgentKnowledgePrompt } from "@/lib/chat-agent/knowledge/build-chat-agent-knowledge-prompt";

describe("buildChatAgentKnowledgePrompt", () => {
  it("lists knowledge bases and requires search_knowledge_base with citations enabled", () => {
    const prompt = buildChatAgentKnowledgePrompt({
      knowledgeBases: [
        { name: "HR Policies", description: "Leave, benefits, and onboarding." },
        { name: "Pricing", description: null },
      ],
      citationsEnabled: true,
    });

    expect(prompt).toContain("- **HR Policies**: Leave, benefits, and onboarding.");
    expect(prompt).toContain("- **Pricing**");
    expect(prompt).toContain("MUST call the `search_knowledge_base` tool");
    expect(prompt).toContain("[filename > section]");
  });

  it("omits citation instructions when citations are disabled", () => {
    const prompt = buildChatAgentKnowledgePrompt({
      knowledgeBases: [{ name: "FAQ", description: "Common questions." }],
      citationsEnabled: false,
    });

    expect(prompt).toContain("search_knowledge_base");
    expect(prompt).not.toContain("[filename > section]");
    expect(prompt).toContain("Do not include source filenames");
  });

  it("returns an empty string when no knowledge bases are assigned", () => {
    expect(
      buildChatAgentKnowledgePrompt({
        knowledgeBases: [],
        citationsEnabled: true,
      }),
    ).toBe("");
  });
});
