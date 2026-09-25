"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useT } from "next-i18next/client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  updateKnowledgeBaseSchema,
  type UpdateKnowledgeBaseValues,
} from "@/lib/knowledge-base/schema";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type KnowledgeBaseToEdit = {
  id: string;
  name: string;
  description: string | null;
};

type EditKnowledgeBaseDialogProps = {
  knowledgeBase: KnowledgeBaseToEdit | null;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void | Promise<void>;
};

export function EditKnowledgeBaseDialog({
  knowledgeBase,
  workspaceId,
  open,
  onOpenChange,
  onUpdated,
}: EditKnowledgeBaseDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useT("dashboard");

  const form = useForm<UpdateKnowledgeBaseValues>({
    resolver: zodResolver(updateKnowledgeBaseSchema),
    defaultValues: {
      name: knowledgeBase?.name ?? "",
      description: knowledgeBase?.description ?? "",
    },
  });

  useEffect(() => {
    if (open && knowledgeBase) {
      form.reset({
        name: knowledgeBase.name,
        description: knowledgeBase.description ?? "",
      });
    }
  }, [open, knowledgeBase, form]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen || !form.formState.isSubmitting) {
      onOpenChange(nextOpen);
    }
  }

  async function onSubmit(values: UpdateKnowledgeBaseValues) {
    if (!knowledgeBase) {
      return;
    }

    const res = await workspaceFetch(
      workspaceId,
      `/api/knowledge-bases/${knowledgeBase.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({
        title: t("agentDetail.knowledge.updated"),
        type: "success",
      });
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", workspaceId],
      });
      await onUpdated?.();
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const descriptionError = form.formState.errors.description;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isSubmitting} className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("agentDetail.knowledge.editDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("agentDetail.knowledge.editDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="edit-kb-name">
                  {t("agentDetail.knowledge.name")}
                </FieldLabel>
                <Input
                  id="edit-kb-name"
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="edit-kb-description">
                  {t("agentDetail.knowledge.description")}
                </FieldLabel>
                <textarea
                  id="edit-kb-description"
                  rows={3}
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              {t("agentDetail.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.saving")}
                </>
              ) : (
                t("agentDetail.save")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
