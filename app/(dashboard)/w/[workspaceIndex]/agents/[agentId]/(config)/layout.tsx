import { ArrowLeftIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "next-i18next/server";

import { AgentDetailNav } from "@/components/agents/agent-detail-nav";
import { Button } from "@/components/ui/button";
import { getAgent } from "@/lib/agents/services/get-agent";
import { getAgentAvatarUrl } from "@/lib/agents/utils/get-agent-avatar-url";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { APIError } from "@/lib/exposers/api-error";
import { getWorkspaceRouteContext } from "@/lib/workspaces/services/get-workspace-route-context";

type AgentDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceIndex: string; agentId: string }>;
};

export default async function AgentDetailLayout({
  children,
  params,
}: AgentDetailLayoutProps) {
  const { workspaceIndex: workspaceIndexParam, agentId } = await params;
  const { workspace, workspaceIndex } =
    await getWorkspaceRouteContext(workspaceIndexParam);
  const { t } = await getT("dashboard");

  let agentName = "";
  let agentDescription: string | null = null;

  try {
    const agent = await getAgent({ workspaceId: workspace.id, agentId });
    agentName = agent.name;
    agentDescription = agent.description;
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");
  const agentHref = `${agentsHref}/${agentId}`;
  const chatHref = `${agentHref}/chat`;
  const avatarUrl = getAgentAvatarUrl(agentName);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={agentsHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {t("agentDetail.back")}
        </Button>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {agentName}
            </h1>
            {agentDescription ? (
              <p className="text-sm text-muted-foreground">
                {agentDescription}
              </p>
            ) : null}
          </div>
          <Button
            className="ml-auto"
            nativeButton={false}
            render={<Link href={chatHref} />}
          >
            <MessageCircleIcon data-icon="inline-start" />
            {t("agentDetail.chat")}
          </Button>
        </div>
      </div>

      <AgentDetailNav
        agentBaseHref={agentHref}
        workspaceId={workspace.id}
        agentId={agentId}
      />

      {children}
    </div>
  );
}
