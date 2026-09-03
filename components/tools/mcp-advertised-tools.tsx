"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import type { ListMcpAdvertisedToolsResult } from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type McpAdvertisedToolsProps = {
  workspaceId: string;
  toolId: string;
  compact?: boolean;
};

async function fetchMcpAdvertisedTools(
  workspaceId: string,
  toolId: string,
): Promise<ListMcpAdvertisedToolsResult> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/tools/${toolId}/advertised-tools`,
  );
  const data = (await res.json()) as ListMcpAdvertisedToolsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not list MCP tools.");
  }

  return data;
}

function CopyableToolName({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  async function copyName() {
    await navigator.clipboard.writeText(name);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="inline-flex items-center gap-1">
      <code className="text-xs">{name}</code>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => {
          void copyName();
        }}
        aria-label={`Copy ${name}`}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </span>
  );
}

export function McpAdvertisedTools({
  workspaceId,
  toolId,
  compact = false,
}: McpAdvertisedToolsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["mcp-advertised-tools", workspaceId, toolId],
    queryFn: () => fetchMcpAdvertisedTools(workspaceId, toolId),
  });

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading advertised MCP tools...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error
          ? error.message
          : "Could not list advertised MCP tools."}
      </p>
    );
  }

  const items = data?.items ?? [];

  if (compact) {
    if (items.length === 0) {
      return (
        <p className="text-xs text-muted-foreground">
          This MCP server did not advertise any tools.
        </p>
      );
    }

    return (
      <p className="text-xs text-muted-foreground">
        Mention in instructions:{" "}
        {items.map((item, index) => (
          <span key={item.name}>
            {index > 0 ? ", " : null}
            <code>{item.name}</code>
          </span>
        ))}
        .
      </p>
    );
  }

  return (
    <Field>
      <FieldLabel>Advertised tools</FieldLabel>
      <FieldDescription>
        These are the names the agent can call. Use them in system prompts and
        skill instructions, not the workspace slug.
      </FieldDescription>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This MCP server did not advertise any tools.
        </p>
      ) : (
        <ul className="space-y-2 rounded-lg border border-border/60 p-3">
          {items.map((item) => (
            <li key={item.name} className="min-w-0">
              <CopyableToolName name={item.name} />
              {item.description ? (
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
