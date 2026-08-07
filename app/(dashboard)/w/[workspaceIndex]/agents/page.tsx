import { AgentsListPage } from "@/components/agents/agents-list-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type ChatAgentsPageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function ChatAgentsPage({
  params,
}: ChatAgentsPageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <AgentsListPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
