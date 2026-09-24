"use client";

import { AlertCircleIcon, BotIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { useT } from "next-i18next/client";

import { ResourceListCapabilityLine } from "@/components/dashboard/resource-list-capability-line";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ConnectionListItem } from "@/lib/connections/types";
import {
  getConnectionAvatarUrl,
  getConnectionTypeLabel,
} from "@/lib/connections/utils/connection-display-utils";

type ConnectionListCardProps = {
  connection: ConnectionListItem;
  detailHref: string;
};

export function ConnectionListCard({
  connection,
  detailHref,
}: ConnectionListCardProps) {
  const { t } = useT("dashboard");
  const avatarUrl = getConnectionAvatarUrl(connection.metadata);
  const typeLabel = getConnectionTypeLabel(connection.channelType);

  return (
    <Card className="relative h-full cursor-pointer transition duration-200 hover:bg-muted/20 hover:shadow-sm hover:ring-foreground/20">
      <Link
        href={detailHref}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`${t("connectionsList.view")} ${connection.name}`}
      />

      <CardHeader className="min-w-0 pb-0">
        <div className="flex min-w-0 items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {typeLabel.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2">{connection.name}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">
              {typeLabel}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5 pt-0">
        {connection.agent ? (
          <ResourceListCapabilityLine
            icon={BotIcon}
            names={[connection.agent.name]}
          />
        ) : (
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground/70">
            <BotIcon
              className="size-3.5 shrink-0 text-muted-foreground/60"
              aria-hidden
            />
            <span className="truncate">{t("connectionsList.noAgent")}</span>
          </div>
        )}

        {connection.lastError ? (
          <div className="flex min-w-0 items-center gap-2 text-xs text-destructive">
            <AlertCircleIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t("connectionsList.connectionError")}</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="pointer-events-none relative z-20 mt-auto gap-2">
        <Button
          variant="default"
          size="sm"
          className="pointer-events-auto"
          nativeButton={false}
          render={<Link href={detailHref} />}
        >
          <SettingsIcon data-icon="inline-start" />
          {t("connectionsList.view")}
        </Button>
      </CardFooter>
    </Card>
  );
}
