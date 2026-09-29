"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import {
  PromptEditorWithImprove,
  requestPromptImprove,
} from "@/components/prompt-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  agentInstructionsFormSchema,
  type AgentInstructionsFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { patchAgent } from "@/lib/agents/utils/patch-agent";
import {
  agentMentionItemsQueryKey,
  fetchAgentMentionItems,
} from "@/lib/agents/utils/fetch-agent-mention-items";

type AgentInstructionsPageProps = {
  agent: AgentListItem;
  workspaceId: string;
};

export function AgentInstructionsPage({
  agent,
  workspaceId,
}: AgentInstructionsPageProps) {
  const router = useRouter();
  const { t } = useT("dashboard");

  const { data: mentionItems } = useQuery({
    queryKey: agentMentionItemsQueryKey(workspaceId, agent.id),
    queryFn: () => fetchAgentMentionItems(workspaceId, agent.id),
  });

  const form = useForm<AgentInstructionsFormValues>({
    resolver: zodResolver(agentInstructionsFormSchema),
    defaultValues: {
      systemPrompt: agent.systemPrompt,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const systemPromptError = form.formState.errors.systemPrompt;

  function improveInstructions(options?: { selectedText?: string }) {
    return requestPromptImprove({
      workspaceId,
      path: `/api/agents/${agent.id}/improve-prompt`,
      body: {
        type: "systemPrompt",
        prompt: form.getValues("systemPrompt"),
        ...(options?.selectedText ? { selection: options.selectedText } : {}),
      },
      readText: (data) =>
        typeof data.prompt === "string" ? data.prompt : undefined,
    });
  }

  async function onSubmit(values: AgentInstructionsFormValues) {
    const result = await patchAgent({
      workspaceId,
      agentId: agent.id,
      body: { systemPrompt: values.systemPrompt },
    });

    if (result.ok) {
      toast.add({ title: result.message, type: "success" });
      form.reset(values);
      router.refresh();
      return;
    }

    toast.add({ title: result.message, type: "error" });
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
              <Field data-invalid={!!systemPromptError || undefined}>
                <FieldLabel htmlFor="agent-system-prompt">
                  {t("agentDetail.instructions.rawLabel")}
                </FieldLabel>
                {mentionItems === undefined ? (
                  <Skeleton className="h-56 w-full rounded-lg" />
                ) : (
                  <Controller
                    control={form.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <PromptEditorWithImprove
                        id="agent-system-prompt"
                        ariaLabel={t("agentDetail.instructions.rawLabel")}
                        ariaInvalid={!!systemPromptError}
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        items={mentionItems}
                        mentionTagsLabel={t(
                          "agentDetail.instructions.mentionTagsLabel",
                        )}
                        mentionHint={t("agentDetail.instructions.mentionHint")}
                        minHeightClassName="min-h-56"
                        improveLabel={t(
                          "agentDetail.instructions.improveWithAi",
                        )}
                        improvingLabel={t("agentDetail.instructions.improving")}
                        onImprove={improveInstructions}
                      />
                    )}
                  />
                )}
                <FieldError errors={[systemPromptError]} />
              </Field>
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
