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
import { toast } from "@/components/ui/toast";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import {
  createToolFormSchema,
  type CreateToolFormValues,
} from "@/lib/tools/schema";
import {
  getToolDefinition,
  isKnownToolRegistryId,
} from "@/lib/tools/tool-registry";
import type { ListToolsResult } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type CreateToolPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  registryToolId?: string;
};

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

function createDefaultValues(registryToolId?: string): CreateToolFormValues {
  const registryTool =
    registryToolId && isKnownToolRegistryId(registryToolId)
      ? getToolDefinition(registryToolId)
      : undefined;

  return {
    name: registryTool?.name ?? "",
    slug: "",
    registryToolId: registryTool?.id ?? "",
    description: registryTool?.description ?? "",
    config: Object.fromEntries(
      (registryTool?.configFields ?? []).map((field) => [
        field.key,
        field.defaultValue ?? "",
      ]),
    ),
  };
}

export function CreateToolPage({
  workspaceId,
  workspaceIndex,
  registryToolId,
}: CreateToolPageProps) {
  const router = useRouter();
  const toolsHref = getDashboardNavHref(workspaceIndex, "tools");

  const selectedRegistryTool = useMemo(() => {
    if (!registryToolId || !isKnownToolRegistryId(registryToolId)) {
      return undefined;
    }

    return getToolDefinition(registryToolId);
  }, [registryToolId]);

  const { data: toolsData } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchTools(workspaceId),
  });

  const usedSlugs = useMemo(
    () => (toolsData?.items ?? []).map((tool) => tool.slug),
    [toolsData?.items],
  );
  const usedSlugSet = useMemo(
    () => new Set(usedSlugs),
    [usedSlugs],
  );

  const form = useForm<CreateToolFormValues>({
    resolver: zodResolver(createToolFormSchema),
    defaultValues: createDefaultValues(registryToolId),
  });

  useEffect(() => {
    if (!selectedRegistryTool) {
      return;
    }

    form.reset(createDefaultValues(registryToolId));
  }, [selectedRegistryTool, registryToolId, form]);

  async function onSubmit(values: CreateToolFormValues) {
    const res = await workspaceFetch(workspaceId, "/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({
        title: data.message ?? "Tool created.",
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

  if (!selectedRegistryTool) {
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
            <CardTitle>Unknown tool</CardTitle>
            <CardDescription>
              Choose a tool from the Available tools tab to add it to your
              workspace.
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
          <h1 className="text-2xl font-semibold tracking-tight">Add tool</h1>
          <p className="text-sm text-muted-foreground">
            Configure {selectedRegistryTool.name} for this workspace.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <input type="hidden" {...form.register("registryToolId")} />
        <Card>
          <CardHeader>
            <CardTitle>{selectedRegistryTool.name}</CardTitle>
            <CardDescription>{selectedRegistryTool.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!slugError || slugTaken || undefined}>
                <FieldLabel htmlFor="create-tool-slug">Slug</FieldLabel>
                <FieldDescription>
                  Unique identifier referenced in agent prompts (e.g.{" "}
                  <code className="text-xs">get_weather</code>).
                </FieldDescription>
                <Input
                  id="create-tool-slug"
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
                <FieldLabel htmlFor="create-tool-name">Name</FieldLabel>
                <FieldDescription>
                  Display name shown in lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id="create-tool-name"
                  autoComplete="off"
                  placeholder={selectedRegistryTool.name}
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="create-tool-description">
                  Description
                </FieldLabel>
                <FieldDescription>
                  Optional summary for lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id="create-tool-description"
                  autoComplete="off"
                  placeholder={selectedRegistryTool.description}
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>

              <ToolConfigFields
                fields={selectedRegistryTool.configFields}
                control={form.control}
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
            <Button
              type="submit"
              disabled={isSubmitting || slugTaken}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Creating…
                </>
              ) : (
                "Create tool"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
