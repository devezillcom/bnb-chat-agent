"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { requestPromptImprove } from "@/components/prompt-editor";
import { SkillFormFields } from "@/components/skills/skill-form-fields";
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
import type { AgentMentionItem } from "@/lib/agents/types";
import {
  skillFormSchema,
  type SkillFormValues,
} from "@/lib/skills/schema";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type AgentSkillSectionProps = {
  agentId: string;
  workspaceId: string;
  skillId?: string;
  defaultValues: SkillFormValues;
  mentionItems: AgentMentionItem[] | undefined;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  removing?: boolean;
  onRemove: () => void | Promise<void>;
  onSaved: (skillId: string, values: SkillFormValues) => void;
};

export function AgentSkillSection({
  agentId,
  workspaceId,
  skillId,
  defaultValues,
  mentionItems,
  expanded,
  onExpandedChange,
  removing = false,
  onRemove,
  onSaved,
}: AgentSkillSectionProps) {
  const { t } = useT("dashboard");
  const isDraft = !skillId;
  const skillMentionItems = useMemo(
    () => mentionItems?.filter((item) => item.id !== skillId),
    [mentionItems, skillId],
  );

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const isSubmitting = form.formState.isSubmitting;
  const displayName =
    form.watch("name") || t("agentDetail.skills.untitled");

  function improveInstructions(options?: { selectedText?: string }) {
    return requestPromptImprove({
      workspaceId,
      path: `/api/agents/${agentId}/improve-prompt`,
      body: {
        type: "skill",
        prompt: form.getValues("instructions"),
        ...(options?.selectedText ? { selection: options.selectedText } : {}),
      },
      readText: (data) =>
        typeof data.prompt === "string" ? data.prompt : undefined,
    });
  }

  async function onSubmit(values: SkillFormValues) {
    const endpoint = skillId
      ? `/api/skills/${skillId}`
      : `/api/agents/${agentId}/skills`;
    const method = skillId ? "PATCH" : "POST";

    const res = await workspaceFetch(workspaceId, endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      toast.add({
        title: data.error ?? data.message ?? t("agentDetail.skills.saveError"),
        type: "error",
      });
      return;
    }

    const savedSkillId = skillId ?? data.id;
    if (!savedSkillId) {
      toast.add({
        title: t("agentDetail.skills.saveError"),
        type: "error",
      });
      return;
    }

    toast.add({
      title: data.message ?? t("agentDetail.skills.saved"),
      type: "success",
    });
    form.reset(values);
    onSaved(savedSkillId, values);
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => onExpandedChange(!expanded)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left"
          >
            <ChevronDownIcon
              className={cn(
                "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            />
            <span className="min-w-0">
              <CardTitle className="truncate">{displayName}</CardTitle>
              {defaultValues.description?.trim() ? (
                <CardDescription className="mt-1 line-clamp-2">
                  {defaultValues.description}
                </CardDescription>
              ) : form.watch("description")?.trim() ? (
                <CardDescription className="mt-1 line-clamp-2">
                  {form.watch("description")}
                </CardDescription>
              ) : null}
            </span>
          </button>
          <CardAction>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removing || isSubmitting}
                  />
                }
              >
                {removing ? (
                  <>
                    <Loader2Icon className="animate-spin" data-icon="inline-start" />
                    {t("agentDetail.skills.removing")}
                  </>
                ) : (
                  t("agentDetail.skills.delete")
                )}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("agentDetail.skills.removeConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isDraft
                      ? t("agentDetail.skills.removeDraftDescription")
                      : t("agentDetail.skills.removeConfirmDescription", {
                          name: displayName,
                        })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={removing}>
                    {t("agentDetail.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={removing}
                    onClick={onRemove}
                  >
                    {removing ? (
                      <>
                        <Loader2Icon
                          className="animate-spin"
                          data-icon="inline-start"
                        />
                        {t("agentDetail.skills.removing")}
                      </>
                    ) : (
                      t("agentDetail.skills.remove")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardAction>
        </div>
      </CardHeader>

      {expanded ? (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CardContent className="pb-0">
            <SkillFormFields
              idPrefix={`agent-skill-${skillId ?? "draft"}`}
              register={form.register}
              control={form.control}
              errors={form.formState.errors}
              mentionItems={skillMentionItems}
              disabled={isSubmitting}
              onImproveInstructions={improveInstructions}
            />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || !form.formState.isDirty}
              onClick={() => form.reset(defaultValues)}
            >
              {t("agentDetail.reset")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.saving")}
                </>
              ) : isDraft ? (
                t("agentDetail.skills.addSkill")
              ) : (
                t("agentDetail.save")
              )}
            </Button>
          </CardFooter>
        </form>
      ) : null}
    </Card>
  );
}
