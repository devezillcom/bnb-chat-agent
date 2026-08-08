import { EditToolPage } from "@/components/tools/edit-tool-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type EditToolRoutePageProps = {
  params: Promise<{ workspaceIndex: string; toolId: string }>;
};

export default async function EditToolRoutePage({
  params,
}: EditToolRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, toolId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <EditToolPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      toolId={toolId}
    />
  );
}
