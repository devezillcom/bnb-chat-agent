"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useT } from "next-i18next/client";

import { AddAgentKnowledgeBaseDialog } from "@/components/agents/add-agent-knowledge-base-dialog";
import { AgentConfigEmptyState } from "@/components/agents/agent-config-empty-state";
import { AgentKnowledgeBaseSection } from "@/components/agents/agent-knowledge-base-section";
import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import type { KnowledgeBaseFormValues } from "@/lib/knowledge-base/schema";
import type { AgentKnowledgeBaseItem } from "@/lib/knowledge-base/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentKnowledgePageProps = {
  agentId: string;
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchAgentKnowledgeBases(
  workspaceId: string,
  agentId: string,
): Promise<AgentKnowledgeBaseItem[]> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/agents/${agentId}/knowledge-bases`,
  );
  const data = (await res.json()) as AgentKnowledgeBaseItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? data.error ?? "Could not load knowledge bases.",
    );
  }

  return data;
}

export function AgentKnowledgePage({
  agentId,
  workspaceId,
  workspaceIndex,
}: AgentKnowledgePageProps) {
  const { t } = useT("dashboard");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const agentKnowledgeBasesQueryKey = [
    "agent-knowledge-bases",
    workspaceId,
    agentId,
  ];

  const {
    data: knowledgeBases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: agentKnowledgeBasesQueryKey,
    queryFn: () => fetchAgentKnowledgeBases(workspaceId, agentId),
  });

  async function invalidateKnowledgeQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: agentKnowledgeBasesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases", workspaceId] }),
    ]);
  }

  async function assignKnowledgeBase(knowledgeBaseId: string) {
    const res = await workspaceFetch(
      workspaceId,
      `/api/agents/${agentId}/knowledge-bases/${knowledgeBaseId}`,
      { method: "POST" },
    );
    const data = (await res.json()) as { message?: string; error?: string };

    if (!res.ok) {
      throw new Error(
        data.error ?? data.message ?? t("agentDetail.knowledge.addError"),
      );
    }
  }

  async function handleCreate(values: KnowledgeBaseFormValues) {
    setCreating(true);

    try {
      const createRes = await workspaceFetch(workspaceId, "/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const createData = (await createRes.json()) as {
        id?: string;
        message?: string;
        error?: string;
      };

      if (!createRes.ok || !createData.id) {
        throw new Error(
          createData.error ??
            createData.message ??
            t("agentDetail.knowledge.createError"),
        );
      }

      await assignKnowledgeBase(createData.id);
      toast.add({
        title: createData.message ?? t("agentDetail.knowledge.createdAndAdded"),
        type: "success",
      });
      setDialogOpen(false);
      await invalidateKnowledgeQueries();
    } catch (createError) {
      toast.add({
        title:
          createError instanceof Error
            ? createError.message
            : t("agentDetail.knowledge.createError"),
        type: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteKnowledgeBase(knowledgeBaseId: string) {
    setDeletingId(knowledgeBaseId);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/knowledge-bases/${knowledgeBaseId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title:
            data.error ?? data.message ?? t("agentDetail.knowledge.deleteError"),
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? t("agentDetail.knowledge.deleted"),
        type: "success",
      });
      await invalidateKnowledgeQueries();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.knowledge.helperTitle")}
        description={t("agentDetail.knowledge.helperDescription")}
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            {t("agentDetail.knowledge.addKnowledgeBase")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : knowledgeBases.length === 0 ? (
          <AgentConfigEmptyState
            icon={BookOpenIcon}
            title={t("agentDetail.knowledge.emptyTitle")}
            description={t("agentDetail.knowledge.emptyDescription")}
            actionLabel={t("agentDetail.knowledge.addKnowledgeBase")}
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          knowledgeBases.map((knowledgeBase) => (
            <AgentKnowledgeBaseSection
              key={knowledgeBase.id}
              workspaceId={workspaceId}
              workspaceIndex={workspaceIndex}
              knowledgeBase={knowledgeBase}
              deleting={deletingId === knowledgeBase.id}
              onDelete={() => handleDeleteKnowledgeBase(knowledgeBase.id)}
            />
          ))
        )}
      </div>

      <AddAgentKnowledgeBaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        creating={creating}
        onCreate={handleCreate}
      />
    </>
  );
}
