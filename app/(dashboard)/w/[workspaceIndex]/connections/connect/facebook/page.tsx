import { ConnectFacebookPage } from "@/components/connections/connect-facebook-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type ConnectFacebookRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function ConnectFacebookRoutePage({
  params,
}: ConnectFacebookRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <ConnectFacebookPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
