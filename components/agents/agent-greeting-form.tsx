"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { AgentConversationStartersField } from "@/components/agents/agent-conversation-starters-field";
import { AgentSectionFormFooter } from "@/components/agents/agent-section-form-footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  agentGreetingFormSchema,
  type AgentGreetingFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { patchAgent } from "@/lib/agents/utils/patch-agent";

type AgentGreetingFormProps = {
  agent: AgentListItem;
  workspaceId: string;
};

export function AgentGreetingForm({
  agent,
  workspaceId,
}: AgentGreetingFormProps) {
  const router = useRouter();
  const { t } = useT("dashboard");
  const form = useForm<AgentGreetingFormValues>({
    resolver: zodResolver(agentGreetingFormSchema),
    defaultValues: {
      firstMessage: agent.firstMessage ?? "",
      conversationStarters: agent.conversationStarters.map((text) => ({
        text,
      })),
    },
  });
  const isSubmitting = form.formState.isSubmitting;
  const firstMessageError = form.formState.errors.firstMessage;

  async function onSubmit(values: AgentGreetingFormValues) {
    const conversationStarters = values.conversationStarters
      .map((item) => item.text.trim())
      .filter((text) => text.length > 0);
    const nextValues: AgentGreetingFormValues = {
      firstMessage: values.firstMessage,
      conversationStarters: conversationStarters.map((text) => ({ text })),
    };
    const result = await patchAgent({
      workspaceId,
      agentId: agent.id,
      body: {
        firstMessage: values.firstMessage ?? "",
        conversationStarters,
      },
    });

    if (result.ok) {
      toast.add({ title: result.message, type: "success" });
      form.reset(nextValues);
      router.refresh();
      return;
    }

    toast.add({ title: result.message, type: "error" });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{t("agentDetail.general.firstMessageTitle")}</CardTitle>
          <CardDescription>
            {t("agentDetail.general.firstMessageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!firstMessageError || undefined}>
              <FieldLabel htmlFor="agent-first-message" className="sr-only">
                {t("agentDetail.general.firstMessageTitle")}
              </FieldLabel>
              <Textarea
                id="agent-first-message"
                rows={3}
                placeholder={t("agentDetail.general.firstMessagePlaceholder")}
                aria-invalid={!!firstMessageError}
                disabled={isSubmitting}
                {...form.register("firstMessage")}
              />
              <FieldError errors={[firstMessageError]} />
            </Field>

            <AgentConversationStartersField
              control={form.control}
              disabled={isSubmitting}
            />
          </FieldGroup>
        </CardContent>
        <AgentSectionFormFooter
          isSubmitting={isSubmitting}
          isDirty={form.formState.isDirty}
          onReset={() => form.reset()}
        />
      </Card>
    </form>
  );
}
