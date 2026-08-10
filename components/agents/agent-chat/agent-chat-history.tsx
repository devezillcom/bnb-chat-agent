"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ListChatAgentSessionsResult } from "@/lib/chat-agent/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

import { agentChatSessionQueryKey } from "./use-agent-chat";

type AgentChatHistoryProps = {
  activeSessionId?: string;
  agentId: string;
  isDisabled: boolean;
  onSelectSession: (sessionId: string) => void;
  workspaceId: string;
};

function formatSessionTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function fetchAgentChatSessions(
  workspaceId: string,
  agentId: string,
  keyword: string,
) {
  const searchParams = new URLSearchParams({
    agentId,
    limit: "50",
  });
  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword) {
    searchParams.set("keyword", trimmedKeyword);
  }

  const response = await workspaceFetch(
    workspaceId,
    `/api/chat-agent/sessions?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error("Could not load chat history.");
  }

  return (await response.json()) as ListChatAgentSessionsResult;
}

export function AgentChatHistory({
  activeSessionId,
  agentId,
  isDisabled,
  onSelectSession,
  workspaceId,
}: AgentChatHistoryProps) {
  const [keyword, setKeyword] = useState("");
  const { data, isError, isLoading } = useQuery({
    queryKey: agentChatSessionQueryKey(workspaceId, agentId, keyword),
    queryFn: () => fetchAgentChatSessions(workspaceId, agentId, keyword),
  });
  const sessions = data?.items ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b p-4 md:px-6">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search conversations"
          aria-label="Search conversations"
          disabled={isDisabled}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2 md:px-4">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : null}

        {isError ? (
          <Empty className="border-0 py-12">
            <EmptyHeader>
              <EmptyTitle>Could not load history</EmptyTitle>
              <EmptyDescription>Please try again shortly.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {!isLoading && !isError && sessions.length === 0 ? (
          <Empty className="border-0 py-12">
            <EmptyHeader>
              <EmptyTitle>No conversations found</EmptyTitle>
              <EmptyDescription>
                Start a new chat to create a conversation.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        <div className="flex flex-col gap-1">
          {sessions.map((session) => (
            <Button
              key={session.id}
              type="button"
              variant={
                session.id === activeSessionId ? "secondary" : "ghost"
              }
              className="h-auto w-full items-start justify-start px-3 py-2 text-left"
              disabled={isDisabled}
              onClick={() => onSelectSession(session.id)}
            >
              <span className="line-clamp-2 w-full text-sm">{session.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatSessionTimestamp(session.updatedAt)}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
