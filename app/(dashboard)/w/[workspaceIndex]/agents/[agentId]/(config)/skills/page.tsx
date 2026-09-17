import { AgentSkillsPage } from "@/components/agents/agent-skills-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentSkillsRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentSkillsRoutePage({
  params,
}: AgentSkillsRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace } = await getWorkspaceRouteContext(workspaceIndexParam);

  return <AgentSkillsPage agentId={agentId} workspaceId={workspace.id} />;
}
