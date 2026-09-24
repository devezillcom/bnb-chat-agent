"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { useT } from "next-i18next/client";

import { AgentConfigEmptyState } from "@/components/agents/agent-config-empty-state";
import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import { AgentSkillSection } from "@/components/agents/agent-skill-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  agentMentionItemsQueryKey,
  fetchAgentMentionItems,
} from "@/lib/agents/utils/fetch-agent-mention-items";
import type { SkillFormValues } from "@/lib/skills/schema";
import type { AgentSkillItem } from "@/lib/skills/types";
import {
  agentSkillItemToFormValues,
  createSkillFormDefaults,
} from "@/lib/skills/utils/skill-form-defaults";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentSkillsPageProps = {
  agentId: string;
  workspaceId: string;
};

type DraftAgentSkill = {
  draftId: string;
  defaultValues: SkillFormValues;
};

async function fetchAgentSkills(
  workspaceId: string,
  agentId: string,
): Promise<AgentSkillItem[]> {
  const res = await workspaceFetch(workspaceId, `/api/agents/${agentId}/skills`);
  const data = (await res.json()) as AgentSkillItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load skills.");
  }

  return data;
}

export function AgentSkillsPage({ agentId, workspaceId }: AgentSkillsPageProps) {
  const { t } = useT("dashboard");
  const queryClient = useQueryClient();
  const [draftSkills, setDraftSkills] = useState<DraftAgentSkill[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  const agentSkillsQueryKey = ["agent-skills", workspaceId, agentId];

  const {
    data: agentSkills = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: agentSkillsQueryKey,
    queryFn: () => fetchAgentSkills(workspaceId, agentId),
  });

  const { data: mentionItems } = useQuery({
    queryKey: agentMentionItemsQueryKey(workspaceId, agentId),
    queryFn: () => fetchAgentMentionItems(workspaceId, agentId),
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

  function handleAddSkill() {
    const draftId = crypto.randomUUID();
    setDraftSkills((current) => [
      ...current,
      { draftId, defaultValues: createSkillFormDefaults() },
    ]);
    setExpanded(draftId, true);
  }

  async function handleRemoveSavedSkill(skillId: string) {
    setRemovingId(skillId);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/agents/${agentId}/skills/${skillId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.error ?? data.message ?? t("agentDetail.skills.removeError"),
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? t("agentDetail.skills.removed"),
        type: "success",
      });
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(skillId);
        return next;
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentSkillsQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["skills", workspaceId] }),
        queryClient.invalidateQueries({
          queryKey: agentMentionItemsQueryKey(workspaceId, agentId),
        }),
      ]);
    } finally {
      setRemovingId(null);
    }
  }

  function handleRemoveDraftSkill(draftId: string) {
    setDraftSkills((current) =>
      current.filter((draft) => draft.draftId !== draftId),
    );
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(draftId);
      return next;
    });
  }

  async function handleSaved(
    sectionId: string,
    skillId: string,
    values: SkillFormValues,
  ) {
    const draft = draftSkills.find((item) => item.draftId === sectionId);

    if (draft) {
      setDraftSkills((current) =>
        current.filter((item) => item.draftId !== sectionId),
      );
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(sectionId);
        next.add(skillId);
        return next;
      });
    }

    queryClient.setQueryData<AgentSkillItem[]>(agentSkillsQueryKey, (current) => {
      const items = current ?? [];
      const existingIndex = items.findIndex((item) => item.id === skillId);
      const nextItem: AgentSkillItem = {
        id: skillId,
        name: values.name,
        description: values.description.trim(),
        instructions: values.instructions,
      };

      if (existingIndex === -1) {
        return [...items, nextItem];
      }

      return items.map((item) => (item.id === skillId ? nextItem : item));
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["skills", workspaceId] }),
      queryClient.invalidateQueries({
        queryKey: agentMentionItemsQueryKey(workspaceId, agentId),
      }),
    ]);
  }

  const hasSkills = agentSkills.length > 0 || draftSkills.length > 0;

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.skills.helperTitle")}
        description={t("agentDetail.skills.helperDescription")}
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleAddSkill}>
            <PlusIcon data-icon="inline-start" />
            {t("agentDetail.skills.add")}
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
        ) : !hasSkills ? (
          <AgentConfigEmptyState
            icon={SparklesIcon}
            title={t("agentDetail.skills.emptyTitle")}
            description={t("agentDetail.skills.emptyDescription")}
            actionLabel={t("agentDetail.skills.add")}
            onAction={handleAddSkill}
          />
        ) : (
          <>
            {agentSkills.map((skill) => (
              <AgentSkillSection
                key={skill.id}
                agentId={agentId}
                workspaceId={workspaceId}
                skillId={skill.id}
                defaultValues={agentSkillItemToFormValues(skill)}
                mentionItems={mentionItems}
                expanded={expandedIds.has(skill.id)}
                onExpandedChange={(open) => setExpanded(skill.id, open)}
                removing={removingId === skill.id}
                onRemove={() => handleRemoveSavedSkill(skill.id)}
                onSaved={(savedSkillId, values) =>
                  handleSaved(skill.id, savedSkillId, values)
                }
              />
            ))}

            {draftSkills.map((draft) => (
              <AgentSkillSection
                key={draft.draftId}
                agentId={agentId}
                workspaceId={workspaceId}
                defaultValues={draft.defaultValues}
                mentionItems={mentionItems}
                expanded={expandedIds.has(draft.draftId)}
                onExpandedChange={(open) => setExpanded(draft.draftId, open)}
                onRemove={() => handleRemoveDraftSkill(draft.draftId)}
                onSaved={(savedSkillId, values) =>
                  handleSaved(draft.draftId, savedSkillId, values)
                }
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
