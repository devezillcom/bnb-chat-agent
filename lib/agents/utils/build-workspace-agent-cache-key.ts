import { createHash } from "crypto";

export type WorkspaceAgentCacheConfig = {
  agentId: string;
  systemPrompt: string;
  model: string;
  tools: Array<{ id: string; slug: string }>;
  knowledgeBaseIds: string[];
  citationsEnabled: boolean;
};

export function buildWorkspaceAgentCacheKey(
  config: WorkspaceAgentCacheConfig,
): string {
  const content = JSON.stringify({
    systemPrompt: config.systemPrompt,
    model: config.model,
    // Slug is part of the key so renaming a tool rebuilds the agent with the
    // new LangChain tool name.
    tools: [...config.tools]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((tool) => `${tool.id}:${tool.slug}`),
    knowledgeBaseIds: [...config.knowledgeBaseIds].sort(),
    citationsEnabled: config.citationsEnabled,
  });
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);

  return `${config.agentId}:${hash}`;
}
