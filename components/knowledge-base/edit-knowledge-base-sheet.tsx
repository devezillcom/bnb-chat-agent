"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import {
  updateKnowledgeBaseNameSchema,
  type UpdateKnowledgeBaseNameValues,
} from "@/lib/knowledge-base/schema";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type KnowledgeBaseToEdit = {
  id: string;
  name: string;
};

type EditKnowledgeBaseSheetProps = {
  knowledgeBase: KnowledgeBaseToEdit | null;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditKnowledgeBaseSheet({
  knowledgeBase,
  workspaceId,
  open,
  onOpenChange,
}: EditKnowledgeBaseSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateKnowledgeBaseNameValues>({
    resolver: zodResolver(updateKnowledgeBaseNameSchema),
    defaultValues: {
      name: knowledgeBase?.name ?? "",
    },
  });

  useEffect(() => {
    if (open && knowledgeBase) {
      form.reset({ name: knowledgeBase.name });
    }
  }, [open, knowledgeBase, form]);

  async function onSubmit(values: UpdateKnowledgeBaseNameValues) {
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
        title: data.message ?? "Knowledge base updated.",
        type: "success",
      });
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", workspaceId],
      });
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <form
          className="flex h-full flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <SheetHeader>
            <SheetTitle>Edit knowledge base</SheetTitle>
            <SheetDescription>
              Update the name for this knowledge base collection.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="edit-kb-name">Name</FieldLabel>
                <Input
                  id="edit-kb-name"
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
