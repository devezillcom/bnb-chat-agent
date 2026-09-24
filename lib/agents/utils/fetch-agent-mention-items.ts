import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

import type { AgentMentionItem } from "../types";

export function agentMentionItemsQueryKey(workspaceId: string, agentId: string) {
  return ["agent-mention-items", workspaceId, agentId];
}

export async function fetchAgentMentionItems(
  workspaceId: string,
  agentId: string,
): Promise<AgentMentionItem[]> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/agents/${agentId}/mention-items`,
  );
  const data = (await res.json()) as AgentMentionItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? data.error ?? "Could not load mention items.",
    );
  }

  return data;
}
