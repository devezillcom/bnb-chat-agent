"use client";

import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useT } from "next-i18next/client";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { ResourceListEmpty } from "@/components/dashboard/resource-list-empty";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterSortListItems,
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/dashboard/filter-sort-list-items";
import { formatListDate } from "@/lib/dashboard/format-list-date";
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
  avatarUrl?: string;
};

export type ResourceListItemVariant = "row" | "card";

type ResourceListPageBaseProps = {
  title: string;
  description?: string;
  items: ResourceListRowItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  createHref?: string;
  createLabel?: string;
  headerAction?: ReactNode;
  getItemHref?: (item: ResourceListRowItem) => string;
  isLoading?: boolean;
  errorMessage?: string;
};

type ResourceListPageProps =
  | (ResourceListPageBaseProps & {
      itemVariant?: "row";
      renderCardItem?: never;
    })
  | (ResourceListPageBaseProps & {
      itemVariant: "card";
      renderCardItem: (item: ResourceListRowItem) => ReactNode;
    });

function ResourceListRow({
  item,
  href,
}: {
  item: ResourceListRowItem;
  href?: string;
}) {
  const content = (
    <>
      {item.leading ? (
        item.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatarUrl}
            alt=""
            className={cn(
              "size-10 shrink-0 rounded-full object-cover",
              item.leading.className,
            )}
          />
        ) : (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              item.leading.className,
            )}
          >
            {item.leading.initials}
          </div>
        )
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate font-medium">{item.name}</p>
          {item.badge ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                item.badge.className ?? "bg-muted text-muted-foreground",
              )}
            >
              {item.badge.label}
            </span>
          ) : null}
        </div>
        {item.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
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
    </>
  );

  const className =
    "flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-muted/20 hover:shadow-sm sm:gap-4 sm:px-5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function ResourceListPage({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  createHref,
  createLabel,
  headerAction,
  getItemHref,
  itemVariant = "row",
  renderCardItem,
  isLoading = false,
  errorMessage,
}: ResourceListPageProps) {
  const { t } = useT("dashboard");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<ListSortOption>("created-desc");

  const resolvedEmptyTitle =
    emptyTitle ?? t("resourceList.emptyDefaultTitle");
  const resolvedEmptyDescription =
    emptyDescription ?? t("resourceList.emptyDefaultDescription");
  const resolvedCreateLabel = createLabel ?? t("resourceList.create");

  const filteredItems = useMemo(
    () => filterSortListItems(items, keyword, sort),
    [items, keyword, sort],
  );

  const activeSortLabel =
    LIST_SORT_OPTIONS.find((option) => option.value === sort)?.labelKey ??
    "sort.createdDesc";

  const hasKeyword = keyword.trim().length > 0;
  const showEmptyState = !isLoading && !errorMessage && filteredItems.length === 0;

  const isCardGrid = itemVariant === "card";

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 md:px-8",
        isCardGrid ? "max-w-7xl" : "max-w-3xl",
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerAction ??
          (createHref ? (
            <Button
              nativeButton={false}
              render={<Link href={createHref} />}
              className="shrink-0"
            >
              <PlusIcon data-icon="inline-start" />
              {resolvedCreateLabel}
            </Button>
          ) : null)}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="max-w-xs">
          <InputGroupInput
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t("resourceList.searchPlaceholder")}
            aria-label={t("resourceList.searchAriaLabel")}
            disabled={isLoading}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

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
            {t(activeSortLabel)}
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => setSort(value as ListSortOption)}
            >
              {LIST_SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {errorMessage ? (
        <ResourceListEmpty
          title={t("resourceList.loadErrorTitle")}
          description={errorMessage}
        />
      ) : isLoading ? (
        <ul
          className={cn(
            isCardGrid
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-2.5",
          )}
        >
          {Array.from({ length: isCardGrid ? 8 : 4 }).map((_, index) => (
            <li key={index}>
              <Skeleton
                className={cn(
                  "w-full rounded-xl",
                  isCardGrid ? "h-44" : "h-18.5",
                )}
              />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("resourceList.count", {
              count: filteredItems.length,
              total: items.length,
            })}
          </p>

          {showEmptyState ? (
            <ResourceListEmpty
              title={
                hasKeyword
                  ? t("resourceList.noMatchTitle")
                  : resolvedEmptyTitle
              }
              description={
                hasKeyword
                  ? t("resourceList.noMatchDescription")
                  : resolvedEmptyDescription
              }
              actionLabel={
                !hasKeyword && createHref ? resolvedCreateLabel : undefined
              }
              actionHref={!hasKeyword && createHref ? createHref : undefined}
            />
          ) : (
            <ul
              className={cn(
                isCardGrid
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-2.5",
              )}
            >
              {filteredItems.map((item) => (
                <li key={item.id} className={isCardGrid ? "min-h-0" : undefined}>
                  {isCardGrid ? (
                    renderCardItem?.(item)
                  ) : (
                    <ResourceListRow
                      item={item}
                      href={getItemHref?.(item)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
