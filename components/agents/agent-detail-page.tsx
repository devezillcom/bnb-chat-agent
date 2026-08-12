"use client";

import {
  ArrowLeftIcon,
  Loader2Icon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EditAgentInfoSheet } from "@/components/agents/edit-agent-info-sheet";
import { AgentCapabilitiesCard } from "@/components/agents/agent-capabilities-card";
import { AgentConnectionsCard } from "@/components/agents/agent-connections-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { getChatModelDefinition } from "@/lib/langchain/models/registry";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentDetailPageProps = {
  agent: AgentListItem;
  workspaceId: string;
  workspaceIndex: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AgentDetailPage({
  agent,
  workspaceId,
  workspaceIndex,
}: AgentDetailPageProps) {
  const router = useRouter();
  const [infoEditOpen, setInfoEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");
  const connectionsHref = getDashboardNavHref(workspaceIndex, "connections");
  const chatHref = `${agentsHref}/${agent.id}/chat`;
  const leading = getAgentListLeading(agent.name);

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/agents/${agent.id}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.message ?? data.error ?? "Could not delete agent.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? "Agent deleted.",
        type: "success",
      });
      setDeleteOpen(false);
      router.push(agentsHref);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={agentsHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to agents
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold",
                leading.className,
              )}
            >
              {leading.initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {agent.name}
              </h1>
              {agent.description ? (
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              ) : null}
            </div>
            <Button
              className="ml-auto"
              nativeButton={false}
              render={<Link href={chatHref} />}
            >
              <MessageCircleIcon data-icon="inline-start" />
              Chat
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Info</CardTitle>
              <CardDescription>Core agent configuration.</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInfoEditOpen(true)}
                >
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <div className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                  <dt className="text-sm text-muted-foreground">Name</dt>
                  <dd className="text-sm font-medium sm:max-w-sm sm:text-right">
                    {agent.name}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <dt className="text-sm text-muted-foreground">Description</dt>
                  <dd className="text-sm font-medium sm:max-w-sm sm:text-right">
                    {agent.description ?? "—"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <dt className="text-sm text-muted-foreground">Model</dt>
                  <dd className="text-sm font-medium sm:max-w-sm sm:text-right">
                    {getChatModelDefinition(agent.model).label}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <dt className="text-sm text-muted-foreground">
                    System prompt
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm font-medium sm:max-w-sm sm:text-right">
                    {agent.systemPrompt}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm font-medium">
                    {formatDate(agent.createdAt)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="text-sm text-muted-foreground">Last updated</dt>
                  <dd className="text-sm font-medium">
                    {formatDate(agent.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <AgentCapabilitiesCard
            agentId={agent.id}
            workspaceId={workspaceId}
            kind="skill"
          />

          <AgentCapabilitiesCard
            agentId={agent.id}
            workspaceId={workspaceId}
            kind="tool"
          />

          <AgentCapabilitiesCard
            agentId={agent.id}
            workspaceId={workspaceId}
            kind="knowledge-base"
          />

          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
              <CardDescription>
                Channels assigned to this agent.
              </CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={connectionsHref} />}
                >
                  <PlusIcon data-icon="inline-start" />
                  Manage connections
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <AgentConnectionsCard
                agentId={agent.id}
                workspaceId={workspaceId}
                workspaceIndex={workspaceIndex}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delete agent</CardTitle>
              <CardDescription>
                Permanently remove this agent and its configuration. This action
                cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-end">
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" disabled={deleting} />
                  }
                >
                  Delete agent
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete agent?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete{" "}
                      <span className="font-medium text-foreground">
                        {agent.name}
                      </span>
                      . This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={deleting}
                      onClick={handleDelete}
                    >
                      {deleting ? (
                        <>
                          <Loader2Icon
                            className="animate-spin"
                            data-icon="inline-start"
                          />
                          Deleting…
                        </>
                      ) : (
                        "Delete agent"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>

      <EditAgentInfoSheet
        agent={agent}
        workspaceId={workspaceId}
        open={infoEditOpen}
        onOpenChange={setInfoEditOpen}
      />
    </>
  );
}
