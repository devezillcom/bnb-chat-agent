import { ConnectionsListPage } from "@/components/connections/connections-list-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type ConnectionsPageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function ConnectionsPage({
  params,
}: ConnectionsPageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <ConnectionsListPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
