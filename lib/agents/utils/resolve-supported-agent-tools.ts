import "server-only";

import {
  getToolDefinition,
  isKnownToolRegistryId,
} from "@/lib/tools/tool-registry";
import type { AgentToolItem } from "@/lib/tools/types";

import { buildToolMentionItems } from "./build-agent-mention-items";

export type SupportedAgentTool = {
  description: string;
  /** Exact `@` mentions the editor recognizes for this tool. */
  mentions: string[];
};

/**
 * Only tools whose `registryToolId` is a known, code-defined registry entry are
 * "supported" — this mirrors how the chat runtime silently skips unknown
 * registry tools (see `listToolsByIds`). Unsupported tools are excluded from
 * the AI context entirely so the model never describes a capability the
 * platform can't actually run.
 */
export function resolveSupportedAgentTools(
  agentTools: AgentToolItem[],
): SupportedAgentTool[] {
  const supported: SupportedAgentTool[] = [];

  for (const tool of agentTools) {
    if (!isKnownToolRegistryId(tool.registryToolId)) {
      continue;
    }

    const definition = getToolDefinition(tool.registryToolId);
    if (!definition) {
      continue;
    }

    supported.push({
      description: tool.description?.trim() || definition.description,
      mentions: buildToolMentionItems(tool).map((item) => `@${item.name}`),
    });
  }

  return supported;
}
