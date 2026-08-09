import { KnowledgeBasesListPage } from "@/components/knowledge-base/knowledge-bases-list-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type KnowledgeBasePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function KnowledgeBasePage({
  params,
}: KnowledgeBasePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <KnowledgeBasesListPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
