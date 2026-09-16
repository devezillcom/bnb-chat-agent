"use client";

import { PlusIcon, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type AgentConfigEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AgentConfigEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: AgentConfigEmptyStateProps) {
  return (
    <Empty className="border border-dashed border-border/60 bg-muted/20 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-11 rounded-xl bg-background shadow-sm">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle className="text-base font-semibold">{title}</EmptyTitle>
        <EmptyDescription className="max-w-sm">{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && onAction ? (
        <EmptyContent>
          <Button onClick={onAction}>
            <PlusIcon data-icon="inline-start" />
            {actionLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
