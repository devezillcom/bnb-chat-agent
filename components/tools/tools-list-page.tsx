"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SearchIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ResourceListEmpty } from "@/components/dashboard/resource-list-empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import {
  filterSortListItems,
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/dashboard/filter-sort-list-items";
import { mapToolsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import type {
  ListToolRegistryResult,
  ListToolsResult,
} from "@/lib/tools/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type ToolToDelete = {
  id: string;
  name: string;
};

type ToolsListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchWorkspaceTools(
  workspaceId: string,
): Promise<ListToolsResult> {
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

async function fetchToolRegistry(
  workspaceId: string,
): Promise<ListToolRegistryResult> {
  const res = await workspaceFetch(workspaceId, "/api/tools/registry");
  const data = (await res.json()) as ListToolRegistryResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tool registry.");
  }

  return data;
}

function formatListDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ToolsListPage({
  workspaceId,
  workspaceIndex,
}: ToolsListPageProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ListSortOption>("created-desc");
  const [activeTab, setActiveTab] = useState("workspace");
  const [toolToDelete, setToolToDelete] = useState<ToolToDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toolsBaseHref = getDashboardNavHref(workspaceIndex, "tools");

  const {
    data: workspaceToolsData,
    isLoading: isLoadingWorkspaceTools,
    error: workspaceToolsError,
  } = useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => fetchWorkspaceTools(workspaceId),
  });

  const {
    data: registryData,
    isLoading: isLoadingRegistry,
    error: registryError,
  } = useQuery({
    queryKey: ["tool-registry", workspaceId],
    queryFn: () => fetchToolRegistry(workspaceId),
  });

  const workspaceItems = mapToolsToListItems(workspaceToolsData?.items ?? []);

  const filteredWorkspaceItems = useMemo(
    () => filterSortListItems(workspaceItems, keyword, sort),
    [workspaceItems, keyword, sort],
  );

  const filteredRegistryItems = useMemo(() => {
    const keywordLower = keyword.trim().toLowerCase();
    const items = registryData?.items ?? [];

    if (!keywordLower) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(keywordLower) ||
        item.description.toLowerCase().includes(keywordLower) ||
        item.id.toLowerCase().includes(keywordLower),
    );
  }, [registryData?.items, keyword]);

  const activeSortLabel =
    LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort";

  const isLoading =
    activeTab === "workspace" ? isLoadingWorkspaceTools : isLoadingRegistry;
  const errorMessage =
    activeTab === "workspace"
      ? workspaceToolsError?.message
      : registryError?.message;

  const hasKeyword = keyword.trim().length > 0;
  const showWorkspaceEmpty =
    !isLoadingWorkspaceTools &&
    !workspaceToolsError &&
    filteredWorkspaceItems.length === 0;
  const showRegistryEmpty =
    !isLoadingRegistry && !registryError && filteredRegistryItems.length === 0;

  async function handleDeleteTool() {
    if (!toolToDelete) {
      return;
    }

    setDeleting(true);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/tools/${toolToDelete.id}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.error ?? data.message ?? "Could not delete tool.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? "Tool deleted.",
        type: "success",
      });
      setToolToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["tools", workspaceId] });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tools</h1>
        <p className="text-sm text-muted-foreground">
          Actions and integrations agents can call while responding to users.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="workspace">Workspace tools</TabsTrigger>
          <TabsTrigger value="available">Available tools</TabsTrigger>
        </TabsList>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search by name..."
              className="pl-8"
              aria-label="Search tools"
              disabled={isLoading}
            />
          </div>

          {activeTab === "workspace" ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between sm:w-auto sm:min-w-40"
                    disabled={isLoading}
                  />
                }
              >
                {activeSortLabel}
                <ChevronDownIcon className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => setSort(value as ListSortOption)}
                >
                  {LIST_SORT_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <TabsContent value="workspace">
          {errorMessage ? (
            <ResourceListEmpty
              title="Could not load tools"
              description={errorMessage}
            />
          ) : isLoadingWorkspaceTools ? (
            <ul className="flex flex-col gap-2.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="h-[74px] w-full rounded-xl" />
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {filteredWorkspaceItems.length} of {workspaceItems.length}
              </p>

              {showWorkspaceEmpty ? (
                <ResourceListEmpty
                  title={hasKeyword ? "No matching results" : "No tools yet"}
                  description={
                    hasKeyword
                      ? "Try a different search term or clear the filter."
                      : "Browse available tools and add one to your workspace."
                  }
                />
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {filteredWorkspaceItems.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 sm:gap-4 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="truncate font-medium">{item.name}</p>
                            {item.badge ? (
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                                  item.badge.className ??
                                    "bg-muted text-muted-foreground",
                                )}
                              >
                                {item.badge.label}
                              </span>
                            ) : null}
                          </div>
                          {item.subtitle ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </p>
                          ) : null}
                          {item.description ? (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                          {item.meta ? (
                            <p className="text-xs text-muted-foreground">
                              {item.meta}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {formatListDate(item.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={
                              <Link href={`${toolsBaseHref}/${item.id}/edit`} />
                            }
                          >
                            Edit
                          </Button>
                          {!item.badge ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setToolToDelete({
                                  id: item.id,
                                  name: item.name,
                                })
                              }
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {!showWorkspaceEmpty && !hasKeyword ? (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("available")}
                  >
                    Browse available tools
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="available">
          {errorMessage ? (
            <ResourceListEmpty
              title="Could not load available tools"
              description={errorMessage}
            />
          ) : isLoadingRegistry ? (
            <ul className="flex flex-col gap-2.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="h-[88px] w-full rounded-xl" />
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                {filteredRegistryItems.length} of {registryData?.items.length ?? 0}
              </p>

              {showRegistryEmpty ? (
                <ResourceListEmpty
                  title={hasKeyword ? "No matching results" : "No tools available"}
                  description={
                    hasKeyword
                      ? "Try a different search term or clear the filter."
                      : "Code-defined tools will appear here when registered."
                  }
                />
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {filteredRegistryItems.map((item) => (
                    <li key={item.id}>
                      <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 sm:gap-4 sm:px-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-medium">{item.name}</p>
                            <code className="text-xs text-muted-foreground">
                              {item.id}
                            </code>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0"
                          nativeButton={false}
                          render={
                            <Link
                              href={`${toolsBaseHref}/new?registryToolId=${encodeURIComponent(item.id)}`}
                            />
                          }
                        >
                          <PlusIcon data-icon="inline-start" />
                          Add
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={toolToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setToolToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tool?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {toolToDelete?.name}
              </span>
              . Agents linked to this tool will lose access. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteTool}
            >
              {deleting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Deleting…
                </>
              ) : (
                "Delete tool"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
