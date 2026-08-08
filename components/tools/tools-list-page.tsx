"use client";

import { useQuery } from "@tanstack/react-query";

import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { mapToolsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import type { ListToolsResult } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type ToolsListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchTools(workspaceId: string): Promise<ListToolsResult> {
  const res = await workspaceFetch(workspaceId, "/api/tools?limit=100");
  const data = (await res.json()) as ListToolsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tools.");
  }

  return data;
}

export function ToolsListPage({
  workspaceId,
  workspaceIndex,
}: ToolsListPageProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchTools(workspaceId),
  });

  const items = mapToolsToListItems(data?.items ?? []);
  const createHref = `${getDashboardNavHref(workspaceIndex, "tools")}/new`;

  return (
    <ResourceListPage
      title="Tools"
      description="Actions and integrations agents can call while responding to users."
      items={items}
      emptyTitle="No tools yet"
      emptyDescription="Add API, MCP, or built-in tools to extend what agents can do."
      createHref={createHref}
      createLabel="Add tool"
      isLoading={isLoading}
      errorMessage={error?.message}
    />
  );
}
