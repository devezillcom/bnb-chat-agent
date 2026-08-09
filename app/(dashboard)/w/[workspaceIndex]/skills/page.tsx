import { SkillsListPage } from "@/components/skills/skills-list-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type SkillsPageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function SkillsPage({ params }: SkillsPageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <SkillsListPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
