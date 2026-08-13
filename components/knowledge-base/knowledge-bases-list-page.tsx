"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";

import { ResourceListEmpty } from "@/components/dashboard/resource-list-empty";
import { EditKnowledgeBaseSheet } from "@/components/knowledge-base/edit-knowledge-base-sheet";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  filterSortListItems,
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/dashboard/filter-sort-list-items";
import { mapKnowledgeBasesToListItems } from "@/lib/dashboard/map-resource-list-items";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { knowledgeBaseFormSchema } from "@/lib/knowledge-base/schema";
import type { ListKnowledgeBasesResult } from "@/lib/knowledge-base/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type KnowledgeBaseToEdit = {
  id: string;
  name: string;
};

type KnowledgeBaseToDelete = {
  id: string;
  name: string;
  documentCount: number;
};

type KnowledgeBasesListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchKnowledgeBases(
  workspaceId: string,
): Promise<ListKnowledgeBasesResult> {
  const res = await workspaceFetch(workspaceId, "/api/knowledge-bases?limit=100");
  const data = (await res.json()) as ListKnowledgeBasesResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load knowledge bases.");
  }

  return data;
}

function formatListDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function KnowledgeBasesListPage({
  workspaceId,
  workspaceIndex,
}: KnowledgeBasesListPageProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ListSortOption>("created-desc");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBaseToEdit | null>(null);
  const [kbToDelete, setKbToDelete] = useState<KnowledgeBaseToDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const knowledgeBaseBaseHref = getDashboardNavHref(
    workspaceIndex,
    "knowledge-base",
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["knowledge-bases", workspaceId],
    queryFn: () => fetchKnowledgeBases(workspaceId),
  });

  const items = mapKnowledgeBasesToListItems(data?.items ?? []);
  const filteredItems = useMemo(
    () => filterSortListItems(items, keyword, sort),
    [items, keyword, sort],
  );

  const activeSortLabel =
    LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort";

  const hasKeyword = keyword.trim().length > 0;
  const showEmptyState =
    !isLoading && !error?.message && filteredItems.length === 0;

  async function handleCreateKnowledgeBase() {
    const parsed = knowledgeBaseFormSchema.safeParse({ name, description });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setFormError(null);
    setCreating(true);

    try {
      const res = await workspaceFetch(workspaceId, "/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const responseData = (await res.json()) as {
        id?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.add({
          title:
            responseData.error ??
            responseData.message ??
            "Could not create knowledge base.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: responseData.message ?? "Knowledge base created.",
        type: "success",
      });
      setName("");
      setDescription("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", workspaceId],
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteKnowledgeBase() {
    if (!kbToDelete) {
      return;
    }

    setDeleting(true);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/knowledge-bases/${kbToDelete.id}`,
        { method: "DELETE" },
      );
      const responseData = (await res.json()) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.add({
          title:
            responseData.error ??
            responseData.message ??
            "Could not delete knowledge base.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: responseData.message ?? "Knowledge base deleted.",
        type: "success",
      });
      setKbToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", workspaceId],
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Knowledge base</h1>
          <p className="text-sm text-muted-foreground">
            Document collections agents can reference when answering questions.
          </p>
        </div>
        <Button className="shrink-0" onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Create knowledge base
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by name..."
            className="pl-8"
            aria-label="Search knowledge bases"
            disabled={isLoading}
          />
        </div>

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
      </div>

      {error?.message ? (
        <ResourceListEmpty
          title="Could not load knowledge bases"
          description={error.message}
        />
      ) : isLoading ? (
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
            {filteredItems.length} of {items.length}
          </p>

          {showEmptyState ? (
            <div className="space-y-4">
              <ResourceListEmpty
                title={hasKeyword ? "No matching results" : "No knowledge bases yet"}
                description={
                  hasKeyword
                    ? "Try a different search term or clear the filter."
                    : "Upload guides, FAQs, and playbooks so agents can answer with accurate context."
                }
              />
              {!hasKeyword ? (
                <div className="flex justify-center">
                  <Button onClick={() => setCreateOpen(true)}>
                    Create knowledge base
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-colors hover:bg-muted/30 sm:gap-4 sm:px-5">
                    <Link
                      href={`${knowledgeBaseBaseHref}/${item.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        {item.meta ? (
                          <p className="text-xs text-muted-foreground">{item.meta}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {formatListDate(item.createdAt)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingKb({
                            id: item.id,
                            name: item.name,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const knowledgeBase = data?.items.find(
                            (entry) => entry.id === item.id,
                          );

                          setKbToDelete({
                            id: item.id,
                            name: item.name,
                            documentCount: knowledgeBase?.documentCount ?? 0,
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <EditKnowledgeBaseSheet
        knowledgeBase={editingKb}
        workspaceId={workspaceId}
        open={editingKb !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingKb(null);
          }
        }}
      />

      <AlertDialog
        open={kbToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setKbToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete knowledge base?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently delete{" "}
                <span className="font-medium text-foreground">
                  {kbToDelete?.name}
                </span>
                .
              </span>
              <span className="block font-medium text-destructive">
                All{" "}
                {kbToDelete?.documentCount === 1
                  ? "1 document"
                  : `${kbToDelete?.documentCount ?? 0} documents`}{" "}
                in this knowledge base will be removed, including uploaded
                files and search indexes.
              </span>
              <span className="block">
                Agents linked to this knowledge base will lose access. This
                action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteKnowledgeBase}
            >
              {deleting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Deleting…
                </>
              ) : (
                "Delete knowledge base"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create knowledge base</DialogTitle>
            <DialogDescription>
              Name a collection for related documents. You can upload files on
              the next screen.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateKnowledgeBase();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="kb-name">Name</Label>
              <Input
                id="kb-name"
                placeholder="Guest FAQ"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kb-description">Description</Label>
              <textarea
                id="kb-description"
                placeholder="Answers to frequently asked guest questions."
                rows={3}
                value={description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(event.target.value)
                }
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFooter className="px-0 pb-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
