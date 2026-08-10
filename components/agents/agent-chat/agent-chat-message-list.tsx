"use client";

import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { AgentListItem } from "@/lib/agents/types";

import { AgentChatEmptyState } from "./agent-chat-empty-state";
import { AgentChatMessage } from "./agent-chat-message";
import type { AgentChatMessage as AgentChatMessageType } from "./types";

type AgentChatMessageListProps = {
  agent: AgentListItem;
  greeting: string;
  messages: AgentChatMessageType[];
  isSending: boolean;
};

export function AgentChatMessageList({
  agent,
  greeting,
  messages,
  isSending,
}: AgentChatMessageListProps) {
  if (messages.length === 0) {
    return <AgentChatEmptyState greeting={greeting} />;
  }

  return (
    <MessageScrollerProvider autoScroll scrollPreviousItemPeek={64}>
      <div className="h-full">
        <MessageScroller className="mx-auto max-w-2xl">
          <MessageScrollerViewport>
            <MessageScrollerContent
              aria-busy={isSending}
              className="p-4 md:p-6"
            >
              {messages.map((message, index) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <AgentChatMessage
                    agent={agent}
                    message={message}
                    isStreaming={
                      isSending &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  );
}
