"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { AgentModelField } from "@/components/agents/agent-model-field";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createAgentFormSchema,
  type CreateAgentFormValues,
} from "@/lib/agents/schema";
import type { AgentListItem } from "@/lib/agents/types";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type EditAgentPageProps = {
  agent: AgentListItem;
  workspaceId: string;
  workspaceIndex: number;
};

export function EditAgentPage({
  agent,
  workspaceId,
  workspaceIndex,
}: EditAgentPageProps) {
  const router = useRouter();
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");
  const agentHref = `${agentsHref}/${agent.id}`;

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
      router.push(agentHref);
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
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={agentHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to agent
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit agent</h1>
          <p className="text-sm text-muted-foreground">
            Update the basic information for {agent.name}.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Info</CardTitle>
            <CardDescription>
              Name, description, and instructions that define how this agent
              behaves.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  rows={6}
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
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              nativeButton={false}
              render={<Link href={agentHref} />}
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
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
