"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ExternalLinkIcon,
  RefreshCcwIcon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ListAgentsResult } from "@/lib/agents/types";
import type { ConnectionDetail } from "@/lib/connections/types";
import {
  getConnectionAvatarUrl,
  getConnectionMetadataString,
  getConnectionTypeLabel,
} from "@/lib/connections/utils/connection-display-utils";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type ConnectionDetailPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  connectionId: string;
  initialConnection: ConnectionDetail;
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

export function ConnectionDetailPage({
  workspaceId,
  workspaceIndex,
  connectionId,
  initialConnection,
}: ConnectionDetailPageProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedAgentId, setSelectedAgentId] = React.useState("");
  const connectionsPath = getDashboardNavHref(workspaceIndex, "connections");

  const { data: connection = initialConnection } = useQuery({
    queryKey: ["connection", workspaceId, connectionId],
    queryFn: async () => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
      );
      const data = (await res.json()) as ConnectionDetail & {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Could not load connection.");
      }

      return data;
    },
    initialData: initialConnection,
  });

  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => fetchAgents(workspaceId),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}/refresh`,
        { method: "POST" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Unable to refresh connection.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Connection refreshed.");
      void queryClient.invalidateQueries({
        queryKey: ["connection", workspaceId, connectionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["connections", workspaceId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to refresh connection.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["connection", workspaceId, connectionId],
      });
    },
  });

  const assignAgentMutation = useMutation({
    mutationFn: async (agentId: string | null) => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agentId }),
        },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Unable to assign agent.");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? "Agent assigned.");
      setSelectedAgentId("");
      void queryClient.invalidateQueries({
        queryKey: ["connection", workspaceId, connectionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["connections", workspaceId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to assign agent.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Unable to delete connection.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Connection deleted.");
      window.location.href = connectionsPath;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete connection.",
      );
    },
  });

  const avatarUrl = getConnectionAvatarUrl(connection.metadata);
  const pageUrl = getConnectionMetadataString(connection.metadata, "page_url");
  const agents = agentsData?.items ?? [];
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="size-14 rounded-full bg-muted" />
          )}
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">
              {getConnectionTypeLabel(connection.channelType)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {connection.name}
            </h1>
            {pageUrl ? (
              <a
                href={pageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                {pageUrl}
                <ExternalLinkIcon className="size-3.5" />
              </a>
            ) : null}
            {connection.lastError ? (
              <p className="text-sm text-destructive">{connection.lastError}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshMutation.isPending}
            onClick={() => refreshMutation.mutate()}
          >
            <RefreshCcwIcon
              className={cn(refreshMutation.isPending && "animate-spin")}
            />
            {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <TrashIcon />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned agent</CardTitle>
          <CardDescription>
            Route conversations from this connection to one chat agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection.agent ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <Link
                href={`${agentsHref}/${connection.agent.id}`}
                className="text-sm font-medium hover:text-primary"
              >
                {connection.agent.name}
              </Link>
              <Button
                variant="ghost"
                size="sm"
                disabled={assignAgentMutation.isPending}
                onClick={() => assignAgentMutation.mutate(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No agent assigned yet.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between sm:flex-1"
                    disabled={isLoadingAgents || agents.length === 0}
                  />
                }
              >
                {selectedAgentId
                  ? agents.find((agent) => agent.id === selectedAgentId)?.name ??
                    "Select an agent"
                  : "Select an agent"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--anchor-width)]">
                {agents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                  >
                    {agent.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              disabled={
                !selectedAgentId ||
                assignAgentMutation.isPending ||
                isLoadingAgents
              }
              onClick={() => assignAgentMutation.mutate(selectedAgentId)}
            >
              {connection.agent ? "Change agent" : "Assign agent"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button nativeButton={false} variant="ghost" render={<Link href={connectionsPath} />}>
          Back to connections
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{connection.name}&quot;? You can reconnect it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete connection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
