"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import { cn } from "@/lib/utils";

import { AgentChatMarkdown } from "./agent-chat-markdown";
import type { AgentChatMessage as AgentChatMessageType } from "./types";

type AgentChatMessageProps = {
  agent: AgentListItem;
  message: AgentChatMessageType;
  isStreaming: boolean;
};

export function AgentChatMessage({
  agent,
  message,
  isStreaming,
}: AgentChatMessageProps) {
  const isUser = message.role === "user";
  const leading = getAgentListLeading(agent.name);
  const content =
    isStreaming && !message.content
      ? `${agent.name} is thinking…`
      : message.content;

  return (
    <Message align={isUser ? "end" : "start"}>
      {!isUser ? (
        <MessageAvatar className="mt-7.5 self-start">
          <Avatar className={cn(leading.className, "text-foreground")}>
            <AvatarFallback>{leading.initials}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
      ) : null}
      <MessageContent>
        {!isUser ? <MessageHeader>{agent.name}</MessageHeader> : null}
        <Bubble align={isUser ? "end" : "start"} variant={isUser ? "default" : "muted"}>
          <BubbleContent
            className={cn(
              isStreaming && !message.content && "shimmer text-muted-foreground",
            )}
          >
            {isUser && message.images?.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {message.images.map((image, index) => (
                  // R2 public URLs are not configured for next/image optimization.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${image.url}-${index}`}
                    src={image.url}
                    alt={image.fileName ?? "Uploaded image"}
                    className="size-24 rounded-lg border border-border object-cover"
                  />
                ))}
              </div>
            ) : null}
            {isUser ? (
              content
            ) : (
              <>
                {!isUser && message.images?.length ? (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {message.images.map((image, index) => (
                      // R2 public URLs are not configured for next/image optimization.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${image.url}-${index}`}
                        src={image.url}
                        alt={image.fileName ?? "Generated image"}
                        className="max-w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <AgentChatMarkdown
                  content={content}
                  className={
                    isStreaming && !message.content
                      ? "shimmer text-muted-foreground"
                      : undefined
                  }
                />
              </>
            )}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
