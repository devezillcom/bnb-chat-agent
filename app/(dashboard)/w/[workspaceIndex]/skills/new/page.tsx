import { CreateSkillPage } from "@/components/skills/create-skill-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type CreateSkillRoutePageProps = {
  params: Promise<{ workspaceIndex: string }>;
};

export default async function CreateSkillRoutePage({
  params,
}: CreateSkillRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <CreateSkillPage
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
