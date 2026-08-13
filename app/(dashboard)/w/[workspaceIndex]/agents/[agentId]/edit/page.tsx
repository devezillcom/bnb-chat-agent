import { notFound } from "next/navigation";

import { EditAgentPage } from "@/components/agents/edit-agent-page";
import { getAgent } from "@/lib/agents/services/get-agent";
import { APIError } from "@/lib/exposers/api-error";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type EditAgentRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function EditAgentRoutePage({
  params,
}: EditAgentRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  try {
    const agent = await getAgent({
      workspaceId: workspace.id,
      agentId,
    });

    return (
      <EditAgentPage
        agent={agent}
        workspaceId={workspace.id}
        workspaceIndex={workspaceIndex}
      />
    );
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }
}
