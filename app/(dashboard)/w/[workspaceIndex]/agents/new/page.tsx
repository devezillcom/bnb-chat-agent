import { CreateAgentPage } from "@/components/agents/create-agent-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type CreateAgentRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function CreateAgentRoutePage({
  params,
}: CreateAgentRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <CreateAgentPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
