import { ConnectWebsitePage } from "@/components/connections/connect-website-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type ConnectWebsiteRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function ConnectWebsiteRoutePage({
  params,
}: ConnectWebsiteRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <ConnectWebsitePage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
