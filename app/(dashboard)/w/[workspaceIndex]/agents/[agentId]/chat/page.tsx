import { notFound } from "next/navigation";

import { AgentChatPage } from "@/components/agents/agent-chat-page";
import { getAgent } from "@/lib/agents/services/get-agent";
import type { AgentListItem } from "@/lib/agents/types";
import { APIError } from "@/lib/exposers/api-error";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentChatRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentChatRoutePage({
  params,
}: AgentChatRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  let agent: AgentListItem;

  try {
    agent = await getAgent({
      workspaceId: workspace.id,
      agentId,
    });
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <AgentChatPage
      agent={agent}
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
