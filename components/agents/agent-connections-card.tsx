"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import type { ListConnectionsForAgentResult } from "@/lib/connections/types";
import { getConnectionTypeLabel } from "@/lib/connections/utils/connection-display-utils";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentConnectionsCardProps = {
  agentId: string;
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchAgentConnections(
  workspaceId: string,
  agentId: string,
): Promise<ListConnectionsForAgentResult> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/agents/${agentId}/connections`,
  );
  const data = (await res.json()) as ListConnectionsForAgentResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load connections.");
  }

  return data;
}

export function AgentConnectionsCard({
  agentId,
  workspaceId,
  workspaceIndex,
}: AgentConnectionsCardProps) {
  const connectionsPath = getDashboardNavHref(workspaceIndex, "connections");
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-connections", workspaceId, agentId],
    queryFn: () => fetchAgentConnections(workspaceId, agentId),
  });

  const connections = data?.items ?? [];

  return (
    <>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading connections...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No connections assigned yet. Connect a channel and assign it to this
          agent from the connection detail page.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {connections.map((connection) => (
            <li
              key={connection.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={`${connectionsPath}/${connection.id}`}
                  className="text-sm font-medium hover:text-primary"
                >
                  {connection.name}
                </Link>
                <p className="text-xs text-muted-foreground capitalize">
                  {getConnectionTypeLabel(connection.channelType)}
                  {connection.lastError ? " · error" : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
