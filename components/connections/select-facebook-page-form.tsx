"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  CompleteFacebookConnectionConnectResult,
  FacebookPageOption,
} from "@/lib/connections/types";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";

type ListFacebookPagesResponse = {
  pages?: FacebookPageOption[];
  error?: string;
  message?: string;
};

type CompleteFacebookConnectResponse =
  Partial<CompleteFacebookConnectionConnectResult> & {
    error?: string;
    message?: string;
  };

type SelectFacebookPageFormProps = {
  workspaceIndex: number;
};

export function SelectFacebookPageForm({
  workspaceIndex,
}: SelectFacebookPageFormProps) {
  const router = useRouter();
  const connectionsPath = getDashboardNavHref(workspaceIndex, "connections");
  const connectFacebookPath = `${connectionsPath}/connect/facebook`;
  const [pages, setPages] = React.useState<FacebookPageOption[]>([]);
  const [selectedPageIds, setSelectedPageIds] = React.useState<string[]>([]);
  const [isLoadingPages, setIsLoadingPages] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      setIsLoadingPages(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/connections/connect/facebook/pages");
        const data = (await response.json()) as ListFacebookPagesResponse;

        if (!response.ok) {
          throw new Error(
            data.message ?? data.error ?? "Unable to load Facebook pages.",
          );
        }

        if (cancelled) {
          return;
        }

        const nextPages = data.pages ?? [];
        setPages(nextPages);
        setSelectedPageIds(nextPages.map((page) => page.id));
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load Facebook pages.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPages(false);
        }
      }
    }

    void loadPages();

    return () => {
      cancelled = true;
    };
  }, []);

  function togglePage(pageId: string, checked: boolean) {
    setSelectedPageIds((current) => {
      if (checked) {
        return current.includes(pageId) ? current : [...current, pageId];
      }

      return current.filter((id) => id !== pageId);
    });
  }

  async function handleConnect() {
    if (selectedPageIds.length === 0) {
      toast.error("Select at least one page.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/connections/connect/facebook/complete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          pageIds: selectedPageIds,
        }),
      });
      const data = (await response.json()) as CompleteFacebookConnectResponse;

      if (!response.ok) {
        toast.error(
          data.message ?? data.error ?? "Unable to connect Facebook pages.",
        );
        return;
      }

      toast.success(data.message ?? "Facebook pages connected.");
      router.push(connectionsPath);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingPages) {
    return (
      <div className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Loading Facebook pages...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
        <Button nativeButton={false} variant="ghost" render={<Link href={connectFacebookPath} />}>
          Try again
        </Button>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        No Facebook pages were found for this account.
      </div>
    );
  }

  const selectedCount = selectedPageIds.length;

  return (
    <div className="mx-auto max-w-xl space-y-6">
        <p className="text-sm text-muted-foreground">
          Select the pages you want to connect. You can assign an agent to each
          connection afterward.
        </p>

      <div className="space-y-2">
        {pages.map((page) => {
          const checked = selectedPageIds.includes(page.id);

          return (
            <label
              key={page.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => togglePage(page.id, event.target.checked)}
                className="size-4 rounded border border-input"
              />
              {page.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.pictureUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{page.name}</p>
                {page.pageUrl ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {page.pageUrl}
                  </p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button nativeButton={false} variant="ghost" render={<Link href={connectionsPath} />}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || selectedPageIds.length === 0}
          onClick={() => void handleConnect()}
        >
          {isSubmitting
            ? "Connecting..."
            : selectedCount === 1
              ? "Connect 1 page"
              : `Connect ${selectedCount} pages`}
        </Button>
      </div>
    </div>
  );
}
