"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";

type ConnectFacebookPageProps = {
  workspaceId: string;
  workspaceIndex: number;
};

export function ConnectFacebookPage({
  workspaceId,
  workspaceIndex,
}: ConnectFacebookPageProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const connectionsPath = getDashboardNavHref(workspaceIndex, "connections");

  const startHref = React.useMemo(() => {
    const params = new URLSearchParams({
      workspaceId,
      workspaceIndex: String(workspaceIndex),
    });

    return `/api/connections/connect/facebook/start?${params.toString()}`;
  }, [workspaceId, workspaceIndex]);

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col justify-center gap-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">Connect Facebook Pages</h1>
        <p className="text-sm text-muted-foreground">
          Authorize this app to access the Facebook pages you manage. We store a
          long-lived page token so your agents can receive and reply to Messenger
          conversations.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button nativeButton={false} render={<Link href={startHref} />}>
          Continue with Facebook
        </Button>
        <Button nativeButton={false} variant="ghost" render={<Link href={connectionsPath} />}>
          Back to connections
        </Button>
      </div>
    </div>
  );
}
