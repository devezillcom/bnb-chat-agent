"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  filterSortListItems,
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/dashboard/filter-sort-list-items";
import { cn } from "@/lib/utils";

export type ResourceListRowItem = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  subtitle?: string;
  meta?: string;
  badge?: {
    label: string;
    className?: string;
  };
  leading?: {
    initials: string;
    className: string;
  };
};

type ResourceListPageProps = {
  title: string;
  description?: string;
  items: ResourceListRowItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

function formatListDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ResourceListPage({
  title,
  description,
  items,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Items will appear here once you add them.",
}: ResourceListPageProps) {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ListSortOption>("created-desc");

  const filteredItems = useMemo(
    () => filterSortListItems(items, keyword, sort),
    [items, keyword, sort],
  );

  const activeSortLabel =
    LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
    "Sort";

  const hasKeyword = keyword.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by name..."
            className="pl-8"
            aria-label="Search list"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-between sm:w-auto sm:min-w-40"
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
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {filteredItems.length} of {items.length}
      </p>

      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">
            {hasKeyword ? "No matching results" : emptyTitle}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasKeyword
              ? "Try a different search term or clear the filter."
              : emptyDescription}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-muted/20 hover:shadow-sm sm:gap-4 sm:px-5">
                {item.leading ? (
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      item.leading.className,
                    )}
                  >
                    {item.leading.initials}
                  </div>
                ) : null}

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
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatListDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
