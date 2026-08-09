import { EditSkillPage } from "@/components/skills/edit-skill-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type EditSkillRoutePageProps = {
  params: Promise<{ workspaceIndex: string; skillId: string }>;
};

export default async function EditSkillRoutePage({
  params,
}: EditSkillRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, skillId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <EditSkillPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
      skillId={skillId}
    />
  );
}
