"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { AgentCapabilitiesCard } from "@/components/agents/agent-capabilities-card";
import { AgentPageHelper } from "@/components/agents/agent-page-helper";
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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  createAgentFormSchema,
  type CreateAgentFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentInstructionsPageProps = {
  agent: AgentListItem;
  workspaceId: string;
};

type PromptMode = "guided" | "advanced";

type GuidedFields = {
  role: string;
  tone: string;
  dos: string;
  donts: string;
};

const emptyGuided: GuidedFields = { role: "", tone: "", dos: "", donts: "" };

function toBullets(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("-") ? line : `- ${line}`))
    .join("\n");
}

function composeGuidedPrompt(fields: GuidedFields) {
  const parts: string[] = [];

  if (fields.role.trim()) {
    parts.push(`You are ${fields.role.trim()}.`);
  }
  if (fields.tone.trim()) {
    parts.push(`Tone & style:\n${fields.tone.trim()}`);
  }
  if (fields.dos.trim()) {
    parts.push(`You should:\n${toBullets(fields.dos)}`);
  }
  if (fields.donts.trim()) {
    parts.push(`You must not:\n${toBullets(fields.donts)}`);
  }

  return parts.join("\n\n");
}

export function AgentInstructionsPage({
  agent,
  workspaceId,
}: AgentInstructionsPageProps) {
  const router = useRouter();
  const { t } = useT("dashboard");

  // Existing prompts cannot be reliably parsed back into guided fields, so
  // default to advanced when a prompt exists; empty prompts start guided.
  const [mode, setMode] = useState<PromptMode>(
    agent.systemPrompt.trim() ? "advanced" : "guided",
  );
  const [guided, setGuided] = useState<GuidedFields>(emptyGuided);

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

  function updateGuided(patch: Partial<GuidedFields>) {
    setGuided((current) => {
      const next = { ...current, ...patch };
      form.setValue("systemPrompt", composeGuidedPrompt(next), {
        shouldDirty: true,
        shouldValidate: form.formState.isSubmitted,
      });
      return next;
    });
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

  const composedPreview = composeGuidedPrompt(guided);

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
              <div className="inline-flex rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("guided")}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    mode === "guided"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("agentDetail.instructions.modeGuided")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("advanced")}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    mode === "advanced"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t("agentDetail.instructions.modeAdvanced")}
                </button>
              </div>

              {mode === "guided" ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="guided-role">
                      {t("agentDetail.instructions.guidedRole")}
                    </FieldLabel>
                    <Textarea
                      id="guided-role"
                      rows={2}
                      placeholder={t(
                        "agentDetail.instructions.guidedRolePlaceholder",
                      )}
                      disabled={isSubmitting}
                      value={guided.role}
                      onChange={(event) =>
                        updateGuided({ role: event.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guided-tone">
                      {t("agentDetail.instructions.guidedTone")}
                    </FieldLabel>
                    <Textarea
                      id="guided-tone"
                      rows={2}
                      placeholder={t(
                        "agentDetail.instructions.guidedTonePlaceholder",
                      )}
                      disabled={isSubmitting}
                      value={guided.tone}
                      onChange={(event) =>
                        updateGuided({ tone: event.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guided-dos">
                      {t("agentDetail.instructions.guidedDos")}
                    </FieldLabel>
                    <Textarea
                      id="guided-dos"
                      rows={3}
                      placeholder={t(
                        "agentDetail.instructions.guidedDosPlaceholder",
                      )}
                      disabled={isSubmitting}
                      value={guided.dos}
                      onChange={(event) =>
                        updateGuided({ dos: event.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="guided-donts">
                      {t("agentDetail.instructions.guidedDonts")}
                    </FieldLabel>
                    <Textarea
                      id="guided-donts"
                      rows={3}
                      placeholder={t(
                        "agentDetail.instructions.guidedDontsPlaceholder",
                      )}
                      disabled={isSubmitting}
                      value={guided.donts}
                      onChange={(event) =>
                        updateGuided({ donts: event.target.value })
                      }
                    />
                  </Field>

                  <Field data-invalid={!!systemPromptError || undefined}>
                    <FieldLabel>
                      {t("agentDetail.instructions.preview")}
                    </FieldLabel>
                    <pre className="max-h-48 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                      {composedPreview ||
                        t("agentDetail.instructions.previewEmpty")}
                    </pre>
                    <FieldError errors={[systemPromptError]} />
                  </Field>
                </FieldGroup>
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
                      disabled={isSubmitting}
                      onClick={() =>
                        toast.add({
                          title: t(
                            "agentDetail.instructions.improveComingSoon",
                          ),
                          type: "info",
                        })
                      }
                    >
                      <SparklesIcon data-icon="inline-start" />
                      {t("agentDetail.instructions.improveWithAi")}
                    </Button>
                  </div>
                  <Textarea
                    id="agent-system-prompt"
                    rows={10}
                    aria-invalid={!!systemPromptError}
                    disabled={isSubmitting}
                    {...form.register("systemPrompt")}
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
                onClick={() => {
                  form.reset();
                  setGuided(emptyGuided);
                }}
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

        <AgentCapabilitiesCard
          agentId={agent.id}
          workspaceId={workspaceId}
          kind="skill"
        />
      </div>
    </>
  );
}
