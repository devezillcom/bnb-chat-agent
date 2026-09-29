"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { AgentAvatarField } from "@/components/agents/agent-avatar-field";
import { AgentModelField } from "@/components/agents/agent-model-field";
import { AgentSectionFormFooter } from "@/components/agents/agent-section-form-footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  agentBasicsFormSchema,
  type AgentBasicsFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { patchAgent } from "@/lib/agents/utils/patch-agent";

type AgentBasicsFormProps = {
  agent: AgentListItem;
  workspaceId: string;
};

export function AgentBasicsForm({ agent, workspaceId }: AgentBasicsFormProps) {
  const router = useRouter();
  const { t } = useT("dashboard");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const form = useForm<AgentBasicsFormValues>({
    resolver: zodResolver(agentBasicsFormSchema),
    defaultValues: {
      name: agent.name,
      description: agent.description ?? "",
      model: agent.model,
      avatarUrl: agent.avatarUrl,
    },
  });
  const name = useWatch({ control: form.control, name: "name" });
  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const descriptionError = form.formState.errors.description;

  async function onSubmit(values: AgentBasicsFormValues) {
    const result = await patchAgent({
      workspaceId,
      agentId: agent.id,
      body: {
        name: values.name,
        description: values.description ?? "",
        model: values.model,
        avatarUrl: values.avatarUrl,
      },
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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{t("agentDetail.general.sectionTitle")}</CardTitle>
          <CardDescription>
            {t("agentDetail.general.sectionDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Controller
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <AgentAvatarField
                  workspaceId={workspaceId}
                  agentId={agent.id}
                  name={name || agent.name}
                  value={field.value}
                  disabled={isSubmitting}
                  onUploadingChange={setUploadingAvatar}
                  onChange={field.onChange}
                />
              )}
            />

            <Field data-invalid={!!nameError || undefined}>
              <FieldLabel htmlFor="agent-name">
                {t("agentDetail.general.name")}
              </FieldLabel>
              <Input
                id="agent-name"
                autoComplete="off"
                aria-invalid={!!nameError}
                disabled={isSubmitting || uploadingAvatar}
                {...form.register("name")}
              />
              <FieldError errors={[nameError]} />
            </Field>

            <Field data-invalid={!!descriptionError || undefined}>
              <FieldLabel htmlFor="agent-description">
                {t("agentDetail.general.description")}
              </FieldLabel>
              <Input
                id="agent-description"
                autoComplete="off"
                aria-invalid={!!descriptionError}
                disabled={isSubmitting || uploadingAvatar}
                {...form.register("description")}
              />
              <FieldError errors={[descriptionError]} />
            </Field>

            <AgentModelField
              control={form.control}
              name="model"
              id="agent-model"
              disabled={isSubmitting || uploadingAvatar}
            />
          </FieldGroup>
        </CardContent>
        <AgentSectionFormFooter
          isSubmitting={isSubmitting}
          isDirty={form.formState.isDirty}
          disabled={uploadingAvatar}
          onReset={() => form.reset()}
        />
      </Card>
    </form>
  );
}
