"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, Loader2Icon, PlusIcon, SearchIcon } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import {
  filterSortListItems,
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/dashboard/filter-sort-list-items";
import { mapSkillsToListItems } from "@/lib/dashboard/map-resource-list-items";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import type { ListSkillsResult } from "@/lib/skills/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";
import { cn } from "@/lib/utils";

type SkillToDelete = {
  id: string;
  name: string;
};

type SkillsListPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

async function fetchSkills(workspaceId: string): Promise<ListSkillsResult> {
  const res = await workspaceFetch(workspaceId, "/api/skills?limit=100");
  const data = (await res.json()) as ListSkillsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load skills.");
  }

  return data;
}

function formatListDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function SkillsListPage({
  workspaceId,
  workspaceIndex,
}: SkillsListPageProps) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ListSortOption>("created-desc");
  const [skillToDelete, setSkillToDelete] = useState<SkillToDelete | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const skillsBaseHref = getDashboardNavHref(workspaceIndex, "skills");
  const createHref = `${skillsBaseHref}/new`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["skills", workspaceId],
    queryFn: () => fetchSkills(workspaceId),
  });

  const items = mapSkillsToListItems(data?.items ?? []);
  const filteredItems = useMemo(
    () => filterSortListItems(items, keyword, sort),
    [items, keyword, sort],
  );

  const activeSortLabel =
    LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Sort";

  const hasKeyword = keyword.trim().length > 0;
  const showEmptyState =
    !isLoading && !error?.message && filteredItems.length === 0;

  async function handleDeleteSkill() {
    if (!skillToDelete) {
      return;
    }

    setDeleting(true);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/skills/${skillToDelete.id}`,
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
            "Could not delete skill.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: responseData.message ?? "Skill deleted.",
        type: "success",
      });
      setSkillToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["skills", workspaceId] });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
          <p className="text-sm text-muted-foreground">
            Reusable capabilities and behaviors you can attach to chat agents.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href={createHref} />}
          className="shrink-0"
        >
          <PlusIcon data-icon="inline-start" />
          Create skill
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
            aria-label="Search skills"
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
          title="Could not load skills"
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
            <ResourceListEmpty
              title={hasKeyword ? "No matching results" : "No skills yet"}
              description={
                hasKeyword
                  ? "Try a different search term or clear the filter."
                  : "Skills define how agents handle specialized tasks like copywriting or guest support."
              }
              actionLabel={!hasKeyword ? "Create skill" : undefined}
              actionHref={!hasKeyword ? createHref : undefined}
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filteredItems.map((item) => (
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
                          <Link href={`${skillsBaseHref}/${item.id}/edit`} />
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setSkillToDelete({
                            id: item.id,
                            name: item.name,
                          })
                        }
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

      <AlertDialog
        open={skillToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setSkillToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {skillToDelete?.name}
              </span>
              . Agents linked to this skill will lose access. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteSkill}
            >
              {deleting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  Deleting…
                </>
              ) : (
                "Delete skill"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
