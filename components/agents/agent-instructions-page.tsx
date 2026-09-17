"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import { PromptEditor } from "@/components/prompt-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  createAgentFormSchema,
  type CreateAgentFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem, AgentMentionItem } from "@/lib/agents/types";
import type { AgentSkillItem } from "@/lib/skills/types";
import type { AgentToolItem } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentInstructionsPageProps = {
  agent: AgentListItem;
  workspaceId: string;
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

export function AgentInstructionsPage({
  agent,
  workspaceId,
}: AgentInstructionsPageProps) {
  const router = useRouter();
  const { t } = useT("dashboard");

  // Reuses the same query keys as the Tools/Skills config pages so the
  // fetch is shared (and cached) across tabs.
  const { data: agentTools = [], isLoading: isLoadingAgentTools } = useQuery({
    queryKey: ["agent-tools", workspaceId, agent.id],
    queryFn: () => fetchAgentTools(workspaceId, agent.id),
  });
  const { data: agentSkills = [], isLoading: isLoadingAgentSkills } = useQuery(
    {
      queryKey: ["agent-skills", workspaceId, agent.id],
      queryFn: () => fetchAgentSkills(workspaceId, agent.id),
    },
  );
  const isLoadingMentionItems = isLoadingAgentTools || isLoadingAgentSkills;

  const mentionItems = useMemo<AgentMentionItem[]>(
    () => [
      ...agentTools.map((tool) => ({
        id: tool.id,
        type: "tool" as const,
        name: tool.name,
      })),
      ...agentSkills.map((skill) => ({
        id: skill.id,
        type: "skill" as const,
        name: skill.name,
      })),
    ],
    [agentTools, agentSkills],
  );

  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentFormSchema),
    defaultValues: {
      // Carried unchanged so the full PATCH payload stays valid; these are
      // edited on the General page.
      name: agent.name,
      description: agent.description ?? "",
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      firstMessage: agent.firstMessage ?? "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const systemPromptError = form.formState.errors.systemPrompt;
  const [isImproving, setIsImproving] = useState(false);

  async function handleImproveWithAi() {
    setIsImproving(true);
    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/agents/${agent.id}/improve-instructions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: form.getValues("systemPrompt"),
          }),
        },
      );
      const data = (await res.json()) as {
        systemPrompt?: string;
        message?: string;
        error?: string;
      };

      if (res.ok && data.systemPrompt) {
        form.setValue("systemPrompt", data.systemPrompt, {
          shouldDirty: true,
          shouldValidate: form.formState.isSubmitted,
        });
        toast.add({
          title: data.message ?? "Instructions improved.",
          type: "success",
        });
        return;
      }

      toast.add({
        title: data.error ?? data.message ?? "Something went wrong.",
        type: "error",
      });
    } catch {
      toast.add({ title: "Something went wrong.", type: "error" });
    } finally {
      setIsImproving(false);
    }
  }

  async function onSubmit(values: CreateAgentFormValues) {
    const res = await workspaceFetch(workspaceId, `/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({ title: data.message ?? "Assistant updated.", type: "success" });
      form.reset(values);
      router.refresh();
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.instructions.helperTitle")}
        description={t("agentDetail.instructions.helperDescription")}
      />

      <div className="space-y-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{t("agentDetail.instructions.promptTitle")}</CardTitle>
              <CardDescription>
                {t("agentDetail.instructions.promptDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingMentionItems ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : (
                <Field data-invalid={!!systemPromptError || undefined}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor="agent-system-prompt">
                      {t("agentDetail.instructions.rawLabel")}
                    </FieldLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting || isImproving}
                      onClick={handleImproveWithAi}
                    >
                      {isImproving ? (
                        <Loader2Icon
                          className="animate-spin"
                          data-icon="inline-start"
                        />
                      ) : (
                        <SparklesIcon data-icon="inline-start" />
                      )}
                      {isImproving
                        ? t("agentDetail.instructions.improving")
                        : t("agentDetail.instructions.improveWithAi")}
                    </Button>
                  </div>
                  <Controller
                    control={form.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <PromptEditor
                        id="agent-system-prompt"
                        ariaLabel={t("agentDetail.instructions.rawLabel")}
                        ariaInvalid={!!systemPromptError}
                        disabled={isSubmitting || isImproving}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        items={mentionItems}
                        minHeightClassName="min-h-56"
                      />
                    )}
                  />
                  <FieldDescription>
                    {t("agentDetail.instructions.mentionHint")}
                  </FieldDescription>
                  <FieldError errors={[systemPromptError]} />
                </Field>
              )}
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || !form.formState.isDirty}
                onClick={() => form.reset()}
              >
                {t("agentDetail.reset")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2Icon
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    {t("agentDetail.saving")}
                  </>
                ) : (
                  t("agentDetail.save")
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
