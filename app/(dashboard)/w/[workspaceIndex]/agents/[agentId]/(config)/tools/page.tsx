import { AgentToolsPage } from "@/components/agents/agent-tools-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentToolsRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentToolsRoutePage({
  params,
}: AgentToolsRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace } = await getWorkspaceRouteContext(workspaceIndexParam);

  return <AgentToolsPage agentId={agentId} workspaceId={workspace.id} />;
}
