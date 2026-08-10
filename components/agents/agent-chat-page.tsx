"use client";

import {
  ArrowLeftIcon,
  HistoryIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AgentChatComposer } from "@/components/agents/agent-chat/agent-chat-composer";
import { AgentChatHistory } from "@/components/agents/agent-chat/agent-chat-history";
import { AgentChatMessageList } from "@/components/agents/agent-chat/agent-chat-message-list";
import { useAgentChat } from "@/components/agents/agent-chat/use-agent-chat";
import { Button } from "@/components/ui/button";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import { DEFAULT_CHANNEL_AGENT_FIRST_MESSAGE } from "@/lib/channel-agent/constants";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { cn } from "@/lib/utils";

type AgentChatPageProps = {
  agent: AgentListItem;
  workspaceId: string;
  workspaceIndex: number;
};

export function AgentChatPage({
  agent,
  workspaceId,
  workspaceIndex,
}: AgentChatPageProps) {
  const [input, setInput] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const {
    handleImageInputChange,
    hasUploadingImages,
    isLoadingSession,
    messages,
    isSending,
    loadSession,
    pendingImages,
    readyImageCount,
    removePendingImage,
    resetChat,
    submitMessage,
    sessionId,
  } = useAgentChat({
    agentId: agent.id,
    workspaceId,
  });
  const agentHref = `${getDashboardNavHref(workspaceIndex, "agents")}/${agent.id}`;
  const leading = getAgentListLeading(agent.name);
  const isInteractionDisabled = isSending || isLoadingSession;
  const canSend =
    !isInteractionDisabled &&
    !hasUploadingImages &&
    (input.trim().length > 0 || readyImageCount > 0);

  function handleSend(message: string) {
    setInput("");
    submitMessage(message);
  }

  function handleNewChat() {
    setInput("");
    resetChat();
    setIsHistoryOpen(false);
  }

  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <header className="mx-auto w-full max-w-2xl shrink-0 px-4 py-8 md:px-8">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            nativeButton={false}
            render={<Link href={agentHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to agent
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold",
                leading.className,
              )}
            >
              {leading.initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {agent.name}
              </h1>
              {agent.description ? (
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>
              ) : null}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                variant={isHistoryOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsHistoryOpen((current) => !current)}
                disabled={isInteractionDisabled}
                aria-pressed={isHistoryOpen}
              >
                <HistoryIcon data-icon="inline-start" />
                History
              </Button>
              <Button
                size="sm"
                onClick={handleNewChat}
                disabled={isInteractionDisabled}
              >
                <PlusIcon data-icon="inline-start" />
                New chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {isHistoryOpen ? (
          <div className="mx-auto flex h-full w-full max-w-2xl px-4 md:px-8">
            <AgentChatHistory
              activeSessionId={sessionId}
              agentId={agent.id}
              isDisabled={isInteractionDisabled}
              onSelectSession={(nextSessionId) => {
                setIsHistoryOpen(false);
                void loadSession(nextSessionId);
              }}
              workspaceId={workspaceId}
            />
          </div>
        ) : (
          <AgentChatMessageList
            agent={agent}
            greeting={
              agent.firstMessage?.trim() || DEFAULT_CHANNEL_AGENT_FIRST_MESSAGE
            }
            messages={messages}
            isSending={isSending}
          />
        )}
      </div>

      {!isHistoryOpen ? (
        <AgentChatComposer
          input={input}
          isSending={isInteractionDisabled}
          pendingImages={pendingImages}
          onInputChange={setInput}
          onImageInputChange={handleImageInputChange}
          onRemovePendingImage={removePendingImage}
          onSend={handleSend}
          canSend={canSend}
        />
      ) : null}
    </section>
  );
}
