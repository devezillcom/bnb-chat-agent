"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { ToolConfigFields } from "@/components/tools/tool-config-fields";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import {
  createToolFormSchema,
  type CreateToolFormValues,
} from "@/lib/tools/schema";
import { getToolDefinition } from "@/lib/tools/tool-registry";
import type { ListToolsResult, ToolDetail } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

async function fetchTools(workspaceId: string): Promise<ListToolsResult> {
  const res = await workspaceFetch(workspaceId, "/api/tools?limit=100");
  const data = (await res.json()) as ListToolsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tools.");
  }

  return data;
}

type EditToolPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  toolId: string;
};

async function fetchTool(
  workspaceId: string,
  toolId: string,
): Promise<ToolDetail> {
  const res = await workspaceFetch(workspaceId, `/api/tools/${toolId}`);
  const data = (await res.json()) as ToolDetail & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tool.");
  }

  return data;
}

function createEditDefaultValues(tool: ToolDetail): CreateToolFormValues {
  const registryTool = getToolDefinition(tool.registryToolId);

  return {
    name: tool.name,
    slug: tool.slug,
    registryToolId: tool.registryToolId,
    description: tool.description ?? "",
    config: Object.fromEntries(
      (registryTool?.configFields ?? []).map((field) => [
        field.key,
        tool.config[field.key] ?? "",
      ]),
    ),
  };
}

export function EditToolPage({
  workspaceId,
  workspaceIndex,
  toolId,
}: EditToolPageProps) {
  const router = useRouter();
  const toolsHref = getDashboardNavHref(workspaceIndex, "tools");

  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tool", workspaceId, toolId],
    queryFn: () => fetchTool(workspaceId, toolId),
  });

  const registryTool = tool ? getToolDefinition(tool.registryToolId) : undefined;

  const { data: toolsData } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchTools(workspaceId),
  });

  const usedSlugSet = useMemo(() => {
    const slugs = (toolsData?.items ?? [])
      .filter((item) => item.id !== toolId)
      .map((item) => item.slug);

    return new Set(slugs);
  }, [toolsData?.items, toolId]);

  const form = useForm<CreateToolFormValues>({
    resolver: zodResolver(createToolFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      registryToolId: "",
      description: "",
      config: {},
    },
  });

  useEffect(() => {
    if (!tool) {
      return;
    }

    form.reset(createEditDefaultValues(tool));
  }, [tool, form]);

  async function onSubmit(values: CreateToolFormValues) {
    const res = await workspaceFetch(workspaceId, `/api/tools/${toolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({
        title: data.message ?? "Tool updated.",
        type: "success",
      });
      router.push(toolsHref);
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const slugError = form.formState.errors.slug;
  const descriptionError = form.formState.errors.description;
  const registryToolIdError = form.formState.errors.registryToolId;
  const configError = form.formState.errors.config;
  const slugValue = form.watch("slug");
  const slugTaken =
    slugValue.trim().length > 0 && usedSlugSet.has(slugValue.trim());

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-4">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !tool || !registryTool) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
        <div className="mb-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={toolsHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to tools
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Could not open tool</CardTitle>
            <CardDescription>
              {error?.message ?? "This tool could not be loaded."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button nativeButton={false} render={<Link href={toolsHref} />}>
              Back to tools
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={toolsHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to tools
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit tool</h1>
          <p className="text-sm text-muted-foreground">
            Update {registryTool.name} settings for this workspace.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("registryToolId")} />
        <Card>
          <CardHeader>
            <CardTitle>{registryTool.name}</CardTitle>
            <CardDescription>{registryTool.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field
                data-invalid={!!slugError || slugTaken || undefined}
              >
                <FieldLabel htmlFor="edit-tool-slug">Slug</FieldLabel>
                <FieldDescription>
                  Unique identifier referenced in agent prompts (e.g.{" "}
                  <code className="text-xs">get_weather</code>).
                </FieldDescription>
                <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                  Changing the slug may break agent prompts that reference
                  the old slug.
                </div>
                <Input
                  id="edit-tool-slug"
                  autoComplete="off"
                  placeholder="get_weather"
                  aria-invalid={!!slugError || slugTaken}
                  disabled={isSubmitting}
                  {...form.register("slug")}
                />
                {slugTaken ? (
                  <FieldError
                    errors={[
                      {
                        message:
                          "This slug is already used in the workspace.",
                      },
                    ]}
                  />
                ) : (
                  <FieldError errors={[slugError]} />
                )}
              </Field>

              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="edit-tool-name">Name</FieldLabel>
                <FieldDescription>
                  Display name shown in lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id="edit-tool-name"
                  autoComplete="off"
                  placeholder={registryTool.name}
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="edit-tool-description">
                  Description
                </FieldLabel>
                <FieldDescription>
                  Optional summary for lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id="edit-tool-description"
                  autoComplete="off"
                  placeholder={registryTool.description}
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>

              <ToolConfigFields
                fields={registryTool.configFields}
                register={form.register}
                disabled={isSubmitting}
                errors={configError}
              />

              <FieldError errors={[registryToolIdError]} />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              nativeButton={false}
              render={<Link href={toolsHref} />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || slugTaken}>
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
