"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { McpAdvertisedTools } from "@/components/tools/mcp-advertised-tools";
import { ToolConfigFields } from "@/components/tools/tool-config-fields";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createToolFormSchema,
  type CreateToolFormValues,
} from "@/lib/tools/schema";
import { getToolDefinition } from "@/lib/tools/tool-registry";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type AgentToolSectionProps = {
  agentId: string;
  workspaceId: string;
  toolId?: string;
  defaultValues: CreateToolFormValues;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  usedSlugs: ReadonlySet<string>;
  removing?: boolean;
  onRemove: () => void | Promise<void>;
  onSaved: (toolId: string, values: CreateToolFormValues) => void;
};

export function AgentToolSection({
  agentId,
  workspaceId,
  toolId,
  defaultValues,
  expanded,
  onExpandedChange,
  usedSlugs,
  removing = false,
  onRemove,
  onSaved,
}: AgentToolSectionProps) {
  const { t } = useT("dashboard");
  const registryTool = getToolDefinition(defaultValues.registryToolId);
  const isDraft = !toolId;

  const form = useForm<CreateToolFormValues>({
    resolver: zodResolver(createToolFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const slugError = form.formState.errors.slug;
  const descriptionError = form.formState.errors.description;
  const registryToolIdError = form.formState.errors.registryToolId;
  const configError = form.formState.errors.config;
  const slugValue = form.watch("slug");
  const displayName = form.watch("name") || registryTool?.name || t("agentDetail.tools.untitled");

  const slugTaken = useMemo(() => {
    const trimmedSlug = slugValue.trim();
    if (!trimmedSlug) {
      return false;
    }

    if (toolId && trimmedSlug === defaultValues.slug) {
      return false;
    }

    return usedSlugs.has(trimmedSlug);
  }, [defaultValues.slug, slugValue, toolId, usedSlugs]);

  async function onSubmit(values: CreateToolFormValues) {
    const endpoint = toolId
      ? `/api/tools/${toolId}`
      : `/api/agents/${agentId}/tools`;
    const method = toolId ? "PATCH" : "POST";

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
        title: data.error ?? data.message ?? t("agentDetail.tools.saveError"),
        type: "error",
      });
      return;
    }

    const savedToolId = toolId ?? data.id;
    if (!savedToolId) {
      toast.add({
        title: t("agentDetail.tools.saveError"),
        type: "error",
      });
      return;
    }

    toast.add({
      title: data.message ?? t("agentDetail.tools.saved"),
      type: "success",
    });
    form.reset(values);
    onSaved(savedToolId, values);
  }

  if (!registryTool) {
    return null;
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
              <CardDescription className="mt-1 line-clamp-2">
                {registryTool.description}
              </CardDescription>
              <code className="mt-1 block text-xs text-muted-foreground">
                {registryTool.id}
              </code>
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
                    {t("agentDetail.tools.removing")}
                  </>
                ) : (
                  t("agentDetail.tools.delete")
                )}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("agentDetail.tools.removeConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isDraft
                      ? t("agentDetail.tools.removeDraftDescription")
                      : t("agentDetail.tools.removeConfirmDescription", {
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
                        {t("agentDetail.tools.removing")}
                      </>
                    ) : (
                      t("agentDetail.tools.remove")
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
          <input type="hidden" {...form.register("registryToolId")} />
          <CardContent className="pb-0">
            <FieldGroup>
              <Field data-invalid={!!slugError || slugTaken || undefined}>
                <FieldLabel htmlFor={`agent-tool-slug-${toolId ?? "draft"}`}>
                  Slug
                </FieldLabel>
                <FieldDescription>
                  {registryTool.id === "mcp"
                    ? "Used to assign this MCP connection to agents and skills. After saving, advertised MCP tool names appear below for prompts and skills."
                    : "Unique identifier referenced in agent prompts (e.g. get_weather)."}
                </FieldDescription>
                {!isDraft ? (
                  <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
                    {registryTool.id === "mcp"
                      ? "Changing the slug only affects assignment to agents and skills."
                      : "Changing the slug may break agent prompts that reference the old slug."}
                  </div>
                ) : null}
                <Input
                  id={`agent-tool-slug-${toolId ?? "draft"}`}
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
                        message: t("agentDetail.tools.slugTaken"),
                      },
                    ]}
                  />
                ) : (
                  <FieldError errors={[slugError]} />
                )}
              </Field>

              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor={`agent-tool-name-${toolId ?? "draft"}`}>
                  Name
                </FieldLabel>
                <FieldDescription>
                  Display name shown in lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id={`agent-tool-name-${toolId ?? "draft"}`}
                  autoComplete="off"
                  placeholder={registryTool.name}
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel
                  htmlFor={`agent-tool-description-${toolId ?? "draft"}`}
                >
                  Description
                </FieldLabel>
                <FieldDescription>
                  Optional summary for lists. Overrides the registry default.
                </FieldDescription>
                <Input
                  id={`agent-tool-description-${toolId ?? "draft"}`}
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
                control={form.control}
                disabled={isSubmitting}
                errors={configError}
              />

              {registryTool.id === "mcp" && toolId ? (
                <McpAdvertisedTools workspaceId={workspaceId} toolId={toolId} />
              ) : null}

              <FieldError errors={[registryToolIdError]} />
            </FieldGroup>
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
            <Button type="submit" disabled={isSubmitting || slugTaken}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.saving")}
                </>
              ) : isDraft ? (
                t("agentDetail.tools.addTool")
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
