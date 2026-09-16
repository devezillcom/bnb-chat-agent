import { notFound } from "next/navigation";

import { AgentGeneralPage } from "@/components/agents/agent-general-page";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgent } from "@/lib/agents/services/get-agent";
import { APIError } from "@/lib/exposers/api-error";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentGeneralRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentGeneralRoutePage({
  params,
}: AgentGeneralRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  let agent: AgentListItem;

  try {
    agent = await getAgent({ workspaceId: workspace.id, agentId });
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <AgentGeneralPage
      agent={agent}
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
