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
  getToolHandlerDefinition,
  TOOL_HANDLER_REGISTRY,
  type ToolHandlerType,
} from "@/lib/tools/tool-handler-registry";
import type { ListToolsResult } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type CreateToolPageProps = {
  workspaceId: string;
  workspaceIndex: number;
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

function createDefaultValues(): CreateToolFormValues {
  return {
    name: "",
    handlerKey: "",
    handlerType: "",
    description: "",
    config: {},
  };
}

export function CreateToolPage({
  workspaceId,
  workspaceIndex,
}: CreateToolPageProps) {
  const router = useRouter();
  const toolsHref = getDashboardNavHref(workspaceIndex, "tools");

  const { data: toolsData } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchTools(workspaceId),
  });

  const usedHandlerKeys = useMemo(
    () => (toolsData?.items ?? []).map((tool) => tool.handlerKey),
    [toolsData?.items],
  );
  const usedHandlerKeySet = useMemo(
    () => new Set(usedHandlerKeys),
    [usedHandlerKeys],
  );

  const form = useForm<CreateToolFormValues>({
    resolver: zodResolver(createToolFormSchema),
    defaultValues: createDefaultValues(),
  });

  const selectedHandlerType = form.watch("handlerType");
  const selectedHandler = useMemo(
    () => getToolHandlerDefinition(selectedHandlerType),
    [selectedHandlerType],
  );

  useEffect(() => {
    if (!selectedHandler) {
      return;
    }

    const nextConfig = Object.fromEntries(
      selectedHandler.configShape.map((field) => [
        field.key,
        form.getValues(`config.${field.key}`) ?? "",
      ]),
    );

    form.setValue("config", nextConfig, { shouldDirty: true });
  }, [selectedHandler, form]);

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
  const handlerKeyError = form.formState.errors.handlerKey;
  const descriptionError = form.formState.errors.description;
  const handlerTypeError = form.formState.errors.handlerType;
  const configError = form.formState.errors.config;
  const handlerKeyValue = form.watch("handlerKey");
  const handlerKeyTaken =
    handlerKeyValue.trim().length > 0 &&
    usedHandlerKeySet.has(handlerKeyValue.trim());

  const canConfigureTool = Boolean(selectedHandler);

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
            Choose a handler type, set a unique handler key, then fill in the
            configuration.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Tool setup</CardTitle>
            <CardDescription>
              Handler type, identifier, and configuration for this tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!handlerTypeError || undefined}>
                <FieldLabel>Handler type</FieldLabel>
                <FieldDescription>
                  Select which handler implementation runs when an agent calls
                  this tool.
                </FieldDescription>
                <div className="grid gap-2">
                  {TOOL_HANDLER_REGISTRY.map((entry) => {
                    const isSelected = selectedHandlerType === entry.handlerType;

                    return (
                      <button
                        key={entry.handlerType}
                        type="button"
                        disabled={isSubmitting}
                        className={cn(
                          "rounded-lg border px-3 py-3 text-left transition",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:border-border hover:bg-muted/20",
                        )}
                        onClick={() =>
                          form.setValue(
                            "handlerType",
                            entry.handlerType as ToolHandlerType,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{entry.name}</p>
                          <code className="text-xs text-muted-foreground">
                            {entry.handlerType}
                          </code>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <FieldError errors={[handlerTypeError]} />
              </Field>

              {canConfigureTool ? (
                <>
                  <Field
                    data-invalid={!!handlerKeyError || handlerKeyTaken || undefined}
                  >
                    <FieldLabel htmlFor="create-tool-handler-key">
                      Handler key
                    </FieldLabel>
                    <FieldDescription>
                      Unique identifier for this tool in the workspace. Used when
                      the handler is triggered at runtime.
                    </FieldDescription>
                    <Input
                      id="create-tool-handler-key"
                      autoComplete="off"
                      placeholder="fetch_weather"
                      aria-invalid={!!handlerKeyError || handlerKeyTaken}
                      disabled={isSubmitting}
                      {...form.register("handlerKey")}
                    />
                    {handlerKeyTaken ? (
                      <FieldError
                        errors={[
                          {
                            message:
                              "This handler key is already used in the workspace.",
                          },
                        ]}
                      />
                    ) : (
                      <FieldError errors={[handlerKeyError]} />
                    )}
                  </Field>

                  <Field data-invalid={!!nameError || undefined}>
                    <FieldLabel htmlFor="create-tool-name">Name</FieldLabel>
                    <FieldDescription>
                      Display name shown in lists. Not required to be unique.
                    </FieldDescription>
                    <Input
                      id="create-tool-name"
                      autoComplete="off"
                      placeholder="Weather API"
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
                    <Input
                      id="create-tool-description"
                      autoComplete="off"
                      placeholder="Fetch current weather for a location."
                      aria-invalid={!!descriptionError}
                      disabled={isSubmitting}
                      {...form.register("description")}
                    />
                    <FieldError errors={[descriptionError]} />
                  </Field>

                  <ToolConfigFields
                    fields={selectedHandler?.configShape ?? []}
                    register={form.register}
                    disabled={isSubmitting}
                    errors={configError}
                  />
                </>
              ) : null}
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
              disabled={isSubmitting || !canConfigureTool || handlerKeyTaken}
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
