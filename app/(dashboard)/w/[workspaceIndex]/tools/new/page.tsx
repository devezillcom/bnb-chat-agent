import { CreateToolPage } from "@/components/tools/create-tool-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type CreateToolRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function CreateToolRoutePage({
  params,
}: CreateToolRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <CreateToolPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
