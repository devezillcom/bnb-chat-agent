"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronDownIcon, PlugIcon } from "lucide-react";

import { ResourceListPage } from "@/components/dashboard/resource-list-page";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CONNECTION_TYPES } from "@/lib/connections/constants";
import type { ListConnectionsResult } from "@/lib/connections/types";
import { mapConnectionListItemsToResourceRows } from "@/lib/connections/utils/map-connection-list-items";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type ConnectionsListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchConnections(
  workspaceId: string,
): Promise<ListConnectionsResult> {
  const res = await workspaceFetch(workspaceId, "/api/connections?limit=100");
  const data = (await res.json()) as ListConnectionsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load connections.");
  }

  return data;
}

export function ConnectionsListPage({
  workspaceId,
  workspaceIndex,
}: ConnectionsListPageProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["connections", workspaceId],
    queryFn: () => fetchConnections(workspaceId),
  });

  const items = mapConnectionListItemsToResourceRows(data?.items ?? []);
  const facebookConnectHref = `${getDashboardNavHref(workspaceIndex, "connections")}/connect/facebook?workspaceId=${encodeURIComponent(workspaceId)}&workspaceIndex=${workspaceIndex}`;

  return (
    <ResourceListPage
      title="Connections"
      description="Channels linked to your agents, such as Facebook Messenger, website widgets, and messaging apps."
      items={items}
      emptyTitle="No connections yet"
      emptyDescription="Connect Facebook pages or other channels to route conversations to agents."
      getItemHref={(item) =>
        `${getDashboardNavHref(workspaceIndex, "connections")}/${item.id}`
      }
      isLoading={isLoading}
      errorMessage={error?.message}
      headerAction={
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button className="shrink-0">
                <PlugIcon data-icon="inline-start" />
                Connect
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="min-w-44">
            {Object.entries(CONNECTION_TYPES).map(([type, config]) => (
              <DropdownMenuItem
                key={type}
                render={<Link href={facebookConnectHref} />}
              >
                Connect {config.label} Pages
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
}
