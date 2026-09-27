import { ConnectionDetailPage } from "@/components/connections/connection-detail-page";
import { WebsiteConnectionDetail } from "@/components/connections/website-connection-detail";
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

  if (connection.channelType === "website") {
    return (
      <WebsiteConnectionDetail
        workspaceId={workspace.id}
        workspaceIndex={workspaceIndex}
        connectionId={connectionId}
        initialConnection={connection}
      />
    );
  }

  return (
    <ConnectionDetailPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      connectionId={connectionId}
      initialConnection={connection}
    />
  );
}
