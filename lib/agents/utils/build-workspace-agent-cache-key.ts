import { createHash } from "crypto";

export type WorkspaceAgentCacheConfig = {
  agentId: string;
  systemPrompt: string;
  toolSlugs: string[];
};

export function buildWorkspaceAgentCacheKey(
  config: WorkspaceAgentCacheConfig,
): string {
  const content = JSON.stringify({
    systemPrompt: config.systemPrompt,
    toolSlugs: [...config.toolSlugs].sort(),
  });
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);

  return `${config.agentId}:${hash}`;
}
