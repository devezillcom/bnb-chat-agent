import { CreateToolPage } from "@/components/tools/create-tool-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type CreateToolRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
  searchParams: Promise<{ registryToolId?: string }>;
};

export default async function CreateToolRoutePage({
  params,
  searchParams,
}: CreateToolRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { registryToolId } = await searchParams;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <CreateToolPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      registryToolId={registryToolId}
    />
  );
}
