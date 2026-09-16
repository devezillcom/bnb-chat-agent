"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useT } from "next-i18next/client";

import { AgentListCard } from "@/components/agents/agent-list-card";
import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapAgentsToListItems } from "@/lib/dashboard/map-resource-list-items";
import type { ListAgentsResult } from "@/lib/agents/types";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentsListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchAgents(workspaceId: string): Promise<ListAgentsResult> {
  const res = await workspaceFetch(workspaceId, "/api/agents?limit=100");
  const data = (await res.json()) as ListAgentsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load agents.");
  }

  return data;
}

export function AgentsListPage({
  workspaceId,
  workspaceIndex,
}: AgentsListPageProps) {
  const { t } = useT("dashboard");
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => fetchAgents(workspaceId),
  });

  const { items, agentsById } = useMemo(() => {
    const agents = data?.items ?? [];

    return {
      items: mapAgentsToListItems(agents),
      agentsById: new Map(agents.map((agent) => [agent.id, agent])),
    };
  }, [data?.items]);
  const agentsBaseHref = getDashboardNavHref(workspaceIndex, "agents");
  const createHref = `${agentsBaseHref}/new`;

  return (
    <ResourceListPage
      title={t("agentsList.title")}
      description={t("agentsList.description")}
      items={items}
      emptyTitle={t("agentsList.emptyTitle")}
      emptyDescription={t("agentsList.emptyDescription")}
      createHref={createHref}
      createLabel={t("agentsList.createLabel")}
      itemVariant="card"
      renderCardItem={(item) => {
        const agent = agentsById.get(item.id);

        if (!agent) {
          return null;
        }

        return (
          <AgentListCard
            agent={agent}
            chatHref={`${agentsBaseHref}/${agent.id}/chat`}
            detailHref={`${agentsBaseHref}/${agent.id}`}
          />
        );
      }}
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
}
