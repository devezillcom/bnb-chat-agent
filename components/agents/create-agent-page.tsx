"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type CreateAgentPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

export function CreateAgentPage({
  workspaceId,
  workspaceIndex,
}: CreateAgentPageProps) {
  const router = useRouter();
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");

  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentFormSchema),
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "",
    },
  });

  async function onSubmit(values: CreateAgentFormValues) {
    const res = await workspaceFetch(workspaceId, "/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { id?: string; message?: string; error?: string };

    if (res.ok && data.id) {
      toast.add({
        title: data.message ?? "Agent created.",
        type: "success",
      });
      router.push(`${agentsHref}/${data.id}`);
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={agentsHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to agents
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Create agent</h1>
          <p className="text-sm text-muted-foreground">
            Set up the basic information for a new chat agent.
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
                <FieldLabel htmlFor="agent-name">Name</FieldLabel>
                <Input
                  id="agent-name"
                  autoComplete="off"
                  placeholder="Guest Support"
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="agent-description">
                  Description
                </FieldLabel>
                <Input
                  id="agent-description"
                  autoComplete="off"
                  placeholder="Handles guest inquiries and booking questions."
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>

              <Field data-invalid={!!systemPromptError || undefined}>
                <FieldLabel htmlFor="agent-system-prompt">
                  System prompt
                </FieldLabel>
                <textarea
                  id="agent-system-prompt"
                  rows={6}
                  placeholder="You are a helpful guest support agent for a short-term rental business..."
                  aria-invalid={!!systemPromptError}
                  disabled={isSubmitting}
                  className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("systemPrompt")}
                />
                <FieldError errors={[systemPromptError]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              nativeButton={false}
              render={<Link href={agentsHref} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Creating…
                </>
              ) : (
                "Create agent"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
