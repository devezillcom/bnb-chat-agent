import { notFound } from "next/navigation";

import { AgentInstructionsPage } from "@/components/agents/agent-instructions-page";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgent } from "@/lib/agents/services/get-agent";
import { APIError } from "@/lib/exposers/api-error";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentInstructionsRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentInstructionsRoutePage({
  params,
}: AgentInstructionsRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace } = await getWorkspaceRouteContext(workspaceIndexParam);

  let agent: AgentListItem;

  try {
    agent = await getAgent({ workspaceId: workspace.id, agentId });
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  return <AgentInstructionsPage agent={agent} workspaceId={workspace.id} />;
}
