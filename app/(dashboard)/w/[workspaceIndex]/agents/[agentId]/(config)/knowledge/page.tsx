import { AgentKnowledgePage } from "@/components/agents/agent-knowledge-page";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentKnowledgeRoutePageProps = {
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentKnowledgeRoutePage({
  params,
}: AgentKnowledgeRoutePageProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);

  return (
    <AgentKnowledgePage
      agentId={agentId}
      workspaceId={workspace.id}
      workspaceIndex={workspaceIndex}
    />
  );
}
