import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { WorkspaceIndexPersist } from "@/components/workspace/workspace-index-persist";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceIndex: string }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaces, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <>
      <WorkspaceIndexPersist workspaceIndex={workspaceIndex} />
      <DashboardShell
        workspace={workspace}
        workspaces={workspaces}
        workspaceIndex={workspaceIndex}
      >
        {children}
      </DashboardShell>
    </>
  );
}
