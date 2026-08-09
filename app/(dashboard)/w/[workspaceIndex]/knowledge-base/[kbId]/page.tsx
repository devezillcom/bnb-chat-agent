import { KnowledgeBaseDetailPage } from "@/components/knowledge-base/knowledge-base-detail-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type KnowledgeBaseDetailRouteProps = {
  params: Promise<{ workspaceIndex: string; kbId: string }>;
};

export default async function KnowledgeBaseDetailRoute({
  params,
}: KnowledgeBaseDetailRouteProps) {
  const { workspaceIndex: workspaceIndexParam, kbId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <KnowledgeBaseDetailPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      knowledgeBaseId={kbId}
    />
  );
}
