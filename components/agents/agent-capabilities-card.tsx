"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type {
  AgentSkillItem,
  ListSkillsResult,
  SkillListItem,
} from "@/lib/skills/types";
import type {
  AgentKnowledgeBaseItem,
  KnowledgeBaseListItem,
  ListKnowledgeBasesResult,
} from "@/lib/knowledge-base/types";
import type {
  AgentToolItem,
  ListToolsResult,
  ToolListItem,
} from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type CapabilityKind = "skill" | "tool" | "knowledge-base";

type CapabilityItem = {
  id: string;
  name: string;
  description: string | null;
  detail: string | null;
};

type AgentCapabilitiesCardProps = {
  agentId: string;
  workspaceId: string;
  kind: CapabilityKind;
};

function getCopy(kind: CapabilityKind) {
  switch (kind) {
    case "skill":
      return {
        title: "Skills",
        description: "Capabilities assigned to this agent.",
        empty: "No skills assigned yet.",
      };
    case "tool":
      return {
        title: "Tools",
        description: "External integrations available to this agent.",
        empty: "No tools assigned yet.",
      };
    case "knowledge-base":
      return {
        title: "Knowledge bases",
        description: "Document collections assigned to this agent.",
        empty: "No knowledge bases assigned yet.",
      };
  }
}

async function fetchJson<Result>(
  workspaceId: string,
  path: string,
  init?: RequestInit,
): Promise<Result> {
  const res = await workspaceFetch(workspaceId, path, init);
  const data = (await res.json()) as Result & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Request failed.");
  }

  return data;
}

function mapAssignedItems(
  kind: CapabilityKind,
  items: AgentSkillItem[] | AgentToolItem[] | AgentKnowledgeBaseItem[],
): CapabilityItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    detail:
      kind === "skill"
        ? (item as AgentSkillItem).slug
        : kind === "tool"
          ? (item as AgentToolItem).registryToolId
          : `${(item as AgentKnowledgeBaseItem).documentCount} documents`,
  }));
}

function mapAvailableItems(
  kind: CapabilityKind,
  result: ListSkillsResult | ListToolsResult | ListKnowledgeBasesResult,
): CapabilityItem[] {
  return result.items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    detail:
      kind === "skill"
        ? (item as SkillListItem).slug
        : kind === "tool"
          ? (item as ToolListItem).registryToolId
          : `${(item as KnowledgeBaseListItem).documentCount} documents`,
  }));
}

export function AgentCapabilitiesCard({
  agentId,
  workspaceId,
  kind,
}: AgentCapabilitiesCardProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const copy = getCopy(kind);
  const pathSegment =
    kind === "knowledge-base" ? "knowledge-bases" : `${kind}s`;
  const pluralLabel =
    kind === "knowledge-base" ? "knowledge bases" : `${kind}s`;
  const singular =
    kind === "knowledge-base" ? "Knowledge base" : kind === "skill" ? "Skill" : "Tool";
  const assignedQueryKey = ["agent-capabilities", workspaceId, agentId, kind];

  const {
    data: assignedData,
    isLoading: isLoadingAssigned,
    error: assignedError,
  } = useQuery({
    queryKey: assignedQueryKey,
    queryFn: () =>
      fetchJson<AgentSkillItem[] | AgentToolItem[] | AgentKnowledgeBaseItem[]>(
        workspaceId,
        `/api/agents/${agentId}/${pathSegment}`,
      ),
  });

  const {
    data: availableData,
    isLoading: isLoadingAvailable,
    error: availableError,
  } = useQuery({
    queryKey: ["capabilities", workspaceId, kind],
    queryFn: () =>
      fetchJson<ListSkillsResult | ListToolsResult | ListKnowledgeBasesResult>(
        workspaceId,
        `/api/${pathSegment}?limit=100&sortKey=name&sortDirection=asc`,
      ),
    enabled: dialogOpen,
  });

  const assigned = mapAssignedItems(kind, assignedData ?? []);
  const available = mapAvailableItems(kind, availableData ?? { items: [], nextOffset: null, total: 0 });
  const unassigned = useMemo(
    () =>
      available.filter(
        (item) => !assigned.some((assignedItem) => assignedItem.id === item.id),
      ),
    [assigned, available],
  );

  function handleDialogOpenChange(open: boolean) {
    if (!open && !adding) {
      setSelectedIds([]);
    }

    setDialogOpen(open);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function handleAdd() {
    if (selectedIds.length === 0) {
      return;
    }

    setAdding(true);

    try {
      await Promise.all(
        selectedIds.map((capabilityId) =>
          fetchJson(
            workspaceId,
            `/api/agents/${agentId}/${pathSegment}/${capabilityId}`,
            { method: "POST" },
          ),
        ),
      );
      toast.add({
        title: `${selectedIds.length} ${pluralLabel} added to agent.`,
        type: "success",
      });
      setSelectedIds([]);
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: assignedQueryKey });
    } catch (error) {
      toast.add({
        title:
          error instanceof Error
            ? error.message
            : `Could not add ${pluralLabel}.`,
        type: "error",
      });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(capability: CapabilityItem) {
    setRemovingId(capability.id);

    try {
      const data = await fetchJson<{ message: string }>(
        workspaceId,
        `/api/agents/${agentId}/${pathSegment}/${capability.id}`,
        { method: "DELETE" },
      );
      toast.add({ title: data.message, type: "success" });
      await queryClient.invalidateQueries({ queryKey: assignedQueryKey });
    } catch (error) {
      toast.add({
        title:
          error instanceof Error
            ? error.message
            : `Could not remove ${kind}.`,
        type: "error",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              <PlusIcon data-icon="inline-start" />
              Add
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoadingAssigned ? (
            <p className="text-sm text-muted-foreground">
              Loading {pluralLabel}...
            </p>
          ) : assignedError ? (
            <p className="text-sm text-destructive">{assignedError.message}</p>
          ) : assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <ul className="divide-y divide-border">
              {assigned.map((capability) => (
                <li
                  key={capability.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{capability.name}</p>
                    {capability.description ? (
                      <p className="text-sm text-muted-foreground">
                        {capability.description}
                      </p>
                    ) : null}
                    {capability.detail ? (
                      <p className="text-xs text-muted-foreground">
                        {capability.detail}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removingId === capability.id}
                    onClick={() => handleRemove(capability)}
                  >
                    {removingId === capability.id ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <Trash2Icon data-icon="inline-start" />
                    )}
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent showCloseButton={!adding} className="max-h-[80vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add {pluralLabel}</DialogTitle>
            <DialogDescription>
              Select the {pluralLabel} this agent can use.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[48vh] overflow-y-auto">
            {isLoadingAvailable ? (
              <p className="py-4 text-sm text-muted-foreground">
                Loading available {pluralLabel}...
              </p>
            ) : availableError ? (
              <p className="py-4 text-sm text-destructive">
                {availableError.message}
              </p>
            ) : unassigned.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No additional {pluralLabel} are available.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 py-1">
                {unassigned.map((capability) => {
                  const isSelected = selectedIds.includes(capability.id);

                  return (
                    <li key={capability.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleSelection(capability.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left",
                          isSelected
                            ? "border-primary bg-accent"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/50",
                          )}
                        >
                          {isSelected ? <CheckIcon className="size-3" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {capability.name}
                          </span>
                          {capability.description ? (
                            <span className="block text-sm text-muted-foreground">
                              {capability.description}
                            </span>
                          ) : null}
                          {capability.detail ? (
                            <span className="block text-xs text-muted-foreground">
                              {capability.detail}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={adding}
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={adding || selectedIds.length === 0}
              onClick={handleAdd}
            >
              {adding ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Adding…
                </>
              ) : (
                selectedIds.length === 0
                  ? `Add ${pluralLabel}`
                  : `Add ${selectedIds.length} ${singular}${selectedIds.length === 1 ? "" : "s"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
