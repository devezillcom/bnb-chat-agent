"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, WrenchIcon } from "lucide-react";
import { useState } from "react";
import { useT } from "next-i18next/client";

import { AddAgentToolDialog } from "@/components/agents/add-agent-tool-dialog";
import { AgentConfigEmptyState } from "@/components/agents/agent-config-empty-state";
import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import { AgentToolSection } from "@/components/agents/agent-tool-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { agentMentionItemsQueryKey } from "@/lib/agents/utils/fetch-agent-mention-items";
import type { CreateToolFormValues } from "@/lib/tools/schema";
import type {
  AgentToolItem,
  ListToolRegistryResult,
} from "@/lib/tools/types";
import {
  agentToolItemToFormValues,
  createToolFormDefaults,
} from "@/lib/tools/utils/create-tool-form-defaults";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentToolsPageProps = {
  agentId: string;
  workspaceId: string;
};

type DraftAgentTool = {
  draftId: string;
  defaultValues: CreateToolFormValues;
};

async function fetchAgentTools(
  workspaceId: string,
  agentId: string,
): Promise<AgentToolItem[]> {
  const res = await workspaceFetch(workspaceId, `/api/agents/${agentId}/tools`);
  const data = (await res.json()) as AgentToolItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tools.");
  }

  return data;
}

async function fetchToolRegistry(
  workspaceId: string,
): Promise<ListToolRegistryResult> {
  const res = await workspaceFetch(workspaceId, "/api/tools/registry");
  const data = (await res.json()) as ListToolRegistryResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tool registry.");
  }

  return data;
}

export function AgentToolsPage({ agentId, workspaceId }: AgentToolsPageProps) {
  const queryClient = useQueryClient();
  const { t } = useT("dashboard");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTools, setDraftTools] = useState<DraftAgentTool[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  const agentToolsQueryKey = ["agent-tools", workspaceId, agentId];

  const {
    data: agentTools = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: agentToolsQueryKey,
    queryFn: () => fetchAgentTools(workspaceId, agentId),
  });

  const {
    data: registryData,
    isLoading: isLoadingRegistry,
    error: registryError,
  } = useQuery({
    queryKey: ["tool-registry", workspaceId],
    queryFn: () => fetchToolRegistry(workspaceId),
    enabled: dialogOpen,
  });

  function setExpanded(id: string, open: boolean) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (open) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function handleSelectRegistryTool(registryToolId: string) {
    const defaultValues = createToolFormDefaults(registryToolId);
    const draftId = crypto.randomUUID();

    setDraftTools((current) => [
      ...current,
      { draftId, defaultValues },
    ]);
    setExpanded(draftId, true);
  }

  async function handleRemoveSavedTool(toolId: string) {
    setRemovingId(toolId);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/agents/${agentId}/tools/${toolId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.error ?? data.message ?? t("agentDetail.tools.removeError"),
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? t("agentDetail.tools.removed"),
        type: "success",
      });
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(toolId);
        return next;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentToolsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: agentMentionItemsQueryKey(workspaceId, agentId),
        }),
      ]);
    } finally {
      setRemovingId(null);
    }
  }

  function handleRemoveDraftTool(draftId: string) {
    setDraftTools((current) =>
      current.filter((draft) => draft.draftId !== draftId),
    );
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(draftId);
      return next;
    });
  }

  function handleSaved(
    sectionId: string,
    toolId: string,
    values: CreateToolFormValues,
  ) {
    const draft = draftTools.find((item) => item.draftId === sectionId);

    if (draft) {
      setDraftTools((current) =>
        current.filter((item) => item.draftId !== sectionId),
      );
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(sectionId);
        next.add(toolId);
        return next;
      });
    }

    void queryClient.invalidateQueries({
      queryKey: agentMentionItemsQueryKey(workspaceId, agentId),
    });

    queryClient.setQueryData<AgentToolItem[]>(agentToolsQueryKey, (current) => {
      const items = current ?? [];
      const nextItem: AgentToolItem = {
        id: toolId,
        name: values.name,
        registryToolId: values.registryToolId,
        description: values.description?.trim() || null,
        config: values.config,
      };
      const existingIndex = items.findIndex((item) => item.id === toolId);

      if (existingIndex === -1) {
        return [...items, nextItem];
      }

      return items.map((item) => (item.id === toolId ? nextItem : item));
    });
  }

  const hasTools = agentTools.length > 0 || draftTools.length > 0;

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.tools.helperTitle")}
        description={t("agentDetail.tools.helperDescription")}
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            {t("agentDetail.tools.add")}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : !hasTools ? (
          <AgentConfigEmptyState
            icon={WrenchIcon}
            title={t("agentDetail.tools.emptyTitle")}
            description={t("agentDetail.tools.emptyDescription")}
            actionLabel={t("agentDetail.tools.add")}
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <>
            {agentTools.map((tool) => (
              <AgentToolSection
                key={tool.id}
                agentId={agentId}
                workspaceId={workspaceId}
                toolId={tool.id}
                defaultValues={agentToolItemToFormValues(tool)}
                expanded={expandedIds.has(tool.id)}
                onExpandedChange={(open) => setExpanded(tool.id, open)}
                removing={removingId === tool.id}
                onRemove={() => handleRemoveSavedTool(tool.id)}
                onSaved={(savedToolId, values) =>
                  handleSaved(tool.id, savedToolId, values)
                }
              />
            ))}

            {draftTools.map((draft) => (
              <AgentToolSection
                key={draft.draftId}
                agentId={agentId}
                workspaceId={workspaceId}
                defaultValues={draft.defaultValues}
                expanded={expandedIds.has(draft.draftId)}
                onExpandedChange={(open) => setExpanded(draft.draftId, open)}
                onRemove={() => handleRemoveDraftTool(draft.draftId)}
                onSaved={(savedToolId, values) =>
                  handleSaved(draft.draftId, savedToolId, values)
                }
              />
            ))}
          </>
        )}
      </div>

      <AddAgentToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        items={registryData?.items ?? []}
        isLoading={isLoadingRegistry}
        errorMessage={registryError?.message}
        onSelect={handleSelectRegistryTool}
      />
    </>
  );
}
