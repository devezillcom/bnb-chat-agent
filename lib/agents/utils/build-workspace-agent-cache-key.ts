import { createHash } from "crypto";

export type WorkspaceAgentCacheConfig = {
  agentId: string;
  systemPrompt: string;
  model: string;
  toolSlugs: string[];
  knowledgeBaseIds: string[];
  citationsEnabled: boolean;
};

export function buildWorkspaceAgentCacheKey(
  config: WorkspaceAgentCacheConfig,
): string {
  const content = JSON.stringify({
    systemPrompt: config.systemPrompt,
    model: config.model,
    toolSlugs: [...config.toolSlugs].sort(),
    knowledgeBaseIds: [...config.knowledgeBaseIds].sort(),
    citationsEnabled: config.citationsEnabled,
  });
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);

  return `${config.agentId}:${hash}`;
}
