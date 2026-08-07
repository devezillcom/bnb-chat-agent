"use client";

import { useQuery } from "@tanstack/react-query";

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
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => fetchAgents(workspaceId),
  });

  const items = mapAgentsToListItems(data?.items ?? []);
  const createHref = `${getDashboardNavHref(workspaceIndex, "agents")}/new`;

  return (
    <ResourceListPage
      title="Chat agents"
      description="Agents configured for this workspace. Each agent can have its own skills, tools, and knowledge base."
      items={items}
      emptyTitle="No chat agents yet"
      emptyDescription="Create an agent to start chatting, embedding on a site, or connecting to support channels."
      createHref={createHref}
      createLabel="Create agent"
      getItemHref={(item) =>
        `${getDashboardNavHref(workspaceIndex, "agents")}/${item.id}`
      }
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
}
