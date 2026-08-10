"use client";

import { MessageCircleDashedIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type AgentChatEmptyStateProps = {
  greeting: string;
};

export function AgentChatEmptyState({
  greeting,
}: AgentChatEmptyStateProps) {
  return (
    <Empty className="h-full border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageCircleDashedIcon />
        </EmptyMedia>
        <EmptyTitle>{greeting}</EmptyTitle>
        <EmptyDescription>
          Press send to start a new conversation.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
