import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type WorkspaceDashboardPageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function WorkspaceDashboardPage({
  params,
}: WorkspaceDashboardPageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaces, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <DashboardHome
      workspace={workspace}
      workspaces={workspaces}
      workspaceIndex={workspaceIndex}
    />
  );
}
