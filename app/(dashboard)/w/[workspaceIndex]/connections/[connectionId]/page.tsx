import { ConnectionDetailPage } from "@/components/connections/connection-detail-page";
import { getConnection } from "@/lib/connections/services/get-connection";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type ConnectionDetailRouteProps = {
  params: Promise<{ workspaceIndex: string; connectionId: string }>;
};

export default async function ConnectionDetailRoute({
  params,
}: ConnectionDetailRouteProps) {
  const { workspaceIndex: workspaceIndexParam, connectionId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  const connection = await getConnection({
    id: connectionId,
    workspaceId: workspace.id,
  });

  return (
    <ConnectionDetailPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      connectionId={connectionId}
      initialConnection={connection}
    />
  );
}
