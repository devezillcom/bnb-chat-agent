"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { AgentModelField } from "@/components/agents/agent-model-field";
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
  createAgentFormSchema,
  type CreateAgentFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type EditAgentInfoSheetProps = {
  agent: AgentListItem;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAgentInfoSheet({
  agent,
  workspaceId,
  open,
  onOpenChange,
}: EditAgentInfoSheetProps) {
  const router = useRouter();

  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentFormSchema),
    defaultValues: {
      name: agent.name,
      description: agent.description ?? "",
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      firstMessage: agent.firstMessage ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: agent.name,
        description: agent.description ?? "",
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        firstMessage: agent.firstMessage ?? "",
      });
    }
  }, [open, agent, form]);

  async function onSubmit(values: CreateAgentFormValues) {
    const res = await workspaceFetch(workspaceId, `/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({
        title: data.message ?? "Agent updated.",
        type: "success",
      });
      onOpenChange(false);
      router.refresh();
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
  const systemPromptError = form.formState.errors.systemPrompt;
  const firstMessageError = form.formState.errors.firstMessage;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <form
          className="flex h-full flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <SheetHeader>
            <SheetTitle>Edit info</SheetTitle>
            <SheetDescription>
              Update the name, description, model, system prompt, and first
              message for this agent.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="edit-agent-name">Name</FieldLabel>
                <Input
                  id="edit-agent-name"
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="edit-agent-description">
                  Description
                </FieldLabel>
                <Input
                  id="edit-agent-description"
                  autoComplete="off"
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>

              <Field data-invalid={!!systemPromptError || undefined}>
                <FieldLabel htmlFor="edit-agent-system-prompt">
                  System prompt
                </FieldLabel>
                <textarea
                  id="edit-agent-system-prompt"
                  rows={8}
                  aria-invalid={!!systemPromptError}
                  disabled={isSubmitting}
                  className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("systemPrompt")}
                />
                <FieldError errors={[systemPromptError]} />
              </Field>

              <AgentModelField
                control={form.control}
                name="model"
                id="edit-agent-model"
                disabled={isSubmitting}
              />

              <Field data-invalid={!!firstMessageError || undefined}>
                <FieldLabel htmlFor="edit-agent-first-message">
                  First message
                </FieldLabel>
                <textarea
                  id="edit-agent-first-message"
                  rows={3}
                  placeholder="Hello! How can I help you today?"
                  aria-invalid={!!firstMessageError}
                  disabled={isSubmitting}
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("firstMessage")}
                />
                <FieldError errors={[firstMessageError]} />
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
