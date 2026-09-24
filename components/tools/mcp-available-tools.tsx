"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useMemo } from "react";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { CreateToolFormValues } from "@/lib/tools/schema";
import type { McpAvailableToolItem } from "@/lib/tools/types";
import {
  parseMcpSelectedToolNames,
  resolveMcpDisplayTools,
} from "@/lib/tools/mcp/utils/parse-mcp-selected-tools";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type McpAvailableToolsProps = {
  workspaceId: string;
  control: Control<CreateToolFormValues>;
  disabled?: boolean;
  errorMessage?: string;
};

async function fetchMcpAvailableTools(
  workspaceId: string,
  config: Record<string, unknown>,
): Promise<McpAvailableToolItem[]> {
  const res = await workspaceFetch(workspaceId, "/api/tools/mcp/available-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  const data = (await res.json()) as { items?: McpAvailableToolItem[] } & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not list MCP tools.");
  }

  return data.items ?? [];
}

function stripMcpToolLists(
  config: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!config) {
    return {};
  }

  const { available_tools: _available, selected_tools: _selected, ...connection } =
    config;
  return connection;
}

export function McpAvailableTools({
  workspaceId,
  control,
  disabled = false,
  errorMessage,
}: McpAvailableToolsProps) {
  const configValues = useWatch({ control, name: "config" });

  const selectedNames = useMemo(
    () => new Set(parseMcpSelectedToolNames(configValues?.selected_tools)),
    [configValues?.selected_tools],
  );
  const displayTools = useMemo(
    () => resolveMcpDisplayTools(configValues ?? {}),
    [configValues],
  );

  const reloadMutation = useMutation({
    mutationFn: () =>
      fetchMcpAvailableTools(workspaceId, stripMcpToolLists(configValues)),
  });

  return (
    <Controller
      control={control}
      name="config"
      render={({ field: configField }) => {
        function updateMcpTools(updates: {
          available_tools: McpAvailableToolItem[];
          selected_tools: string[];
        }) {
          configField.onChange({
            ...configField.value,
            ...updates,
          });
        }

        function handleToggle(tool: McpAvailableToolItem, checked: boolean) {
          const current = parseMcpSelectedToolNames(
            configField.value?.selected_tools,
          );
          const nextSelected = checked
            ? [...current.filter((name) => name !== tool.name), tool.name]
            : current.filter((name) => name !== tool.name);

          updateMcpTools({
            available_tools: resolveMcpDisplayTools(configField.value ?? {}),
            selected_tools: nextSelected,
          });
        }

        async function handleReload() {
          try {
            const items = await reloadMutation.mutateAsync();
            const availableNames = new Set(items.map((item) => item.name));
            const nextSelected = parseMcpSelectedToolNames(
              configField.value?.selected_tools,
            ).filter((name) => availableNames.has(name));

            updateMcpTools({
              available_tools: items,
              selected_tools: nextSelected,
            });
          } catch {
            // Error state is shown from reloadMutation.error.
          }
        }

        return (
          <Field data-invalid={!!errorMessage || undefined}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <FieldLabel>Available tools</FieldLabel>
                <FieldDescription>
                  Reload tools from the MCP server, then choose which ones this
                  agent can call. Selections are saved with the tool.
                </FieldDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || reloadMutation.isPending}
                onClick={() => {
                  void handleReload();
                }}
              >
                {reloadMutation.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" data-icon="inline-start" />
                    Reloading...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon data-icon="inline-start" />
                    Reload available tools
                  </>
                )}
              </Button>
            </div>

            {reloadMutation.error ? (
              <p className="text-sm text-destructive">
                {reloadMutation.error instanceof Error
                  ? reloadMutation.error.message
                  : "Could not list MCP tools."}
              </p>
            ) : null}

            {displayTools.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tools loaded yet. Reload available tools to choose MCP tools.
              </p>
            ) : (
              <ul className="space-y-2 rounded-lg border border-border/60 p-3">
                {displayTools.map((tool) => {
                  const checkboxId = `mcp-tool-${tool.name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

                  return (
                    <li key={tool.name} className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        id={checkboxId}
                        checked={selectedNames.has(tool.name)}
                        disabled={disabled}
                        onCheckedChange={(checked) => {
                          handleToggle(tool, checked === true);
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={checkboxId}
                          className="block cursor-pointer text-sm font-medium"
                        >
                          <code className="text-xs">{tool.name}</code>
                        </label>
                        {tool.description ? (
                          <p className="text-xs text-muted-foreground">
                            {tool.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <FieldError
              errors={errorMessage ? [{ message: errorMessage }] : undefined}
            />
          </Field>
        );
      }}
    />
  );
}
