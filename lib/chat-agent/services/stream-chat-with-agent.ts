import { randomUUID } from "crypto";

import type { ChatAgentStreamEvent, ChatWithAgentParams } from "../types";
import { buildChatAgentHumanMessage } from "../utils/build-chat-agent-human-message";
import { createChatAgentRunConfig } from "../utils/create-chat-agent-run-config";
import { extractMessageContent } from "../utils/extract-message-content";
import { getChatAgent } from "./create-chat-agent";
import {
  resolveChatAgentContext,
  type ResolveChatAgentContextResult,
} from "./resolve-chat-agent-context";
import { upsertChatAgentSession } from "./upsert-chat-agent-session";

type StreamedMessageChunk = {
  content?: unknown;
  id?: string;
  _getType?: () => string;
  type?: string;
};

function separatorBeforeNextMessageToken(
  accumulatedText: string,
  nextText: string,
  previousMessageId: string | undefined,
  nextMessageId: string | undefined,
): string {
  if (
    !previousMessageId ||
    !nextMessageId ||
    previousMessageId === nextMessageId ||
    accumulatedText.length === 0
  ) {
    return "";
  }

  if (/\s$/.test(accumulatedText) || /^\s/.test(nextText)) {
    return "";
  }

  return " ";
}

async function* streamChatAgentTokens(
  params: ChatWithAgentParams,
  sessionId: string,
  agentContext: ResolveChatAgentContextResult,
): AsyncGenerator<string> {
  const agent = await getChatAgent(agentContext);
  const runConfig = createChatAgentRunConfig(sessionId, {
    userId: params.userId,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });

  const humanMessage = await buildChatAgentHumanMessage(
    params.message,
    params.images,
  );

  const stream = await agent.stream(
    {
      messages: [humanMessage],
    },
    { ...runConfig, streamMode: "messages" },
  );

  let lastMessageId: string | undefined;
  let accumulatedText = "";

  for await (const chunk of stream) {
    const [message, metadata] = chunk as [
      StreamedMessageChunk,
      { langgraph_node?: string } | undefined,
    ];

    if (metadata?.langgraph_node && metadata.langgraph_node !== "model_request") {
      continue;
    }

    const messageType = message._getType?.() ?? message.type;
    if (messageType !== "ai" && messageType !== "AIMessageChunk") {
      continue;
    }

    const text = extractMessageContent(message.content);
    if (!text) continue;

    const messageId = message.id;
    const separator = separatorBeforeNextMessageToken(
      accumulatedText,
      text,
      lastMessageId,
      messageId,
    );

    if (separator) {
      accumulatedText += separator;
      yield separator;
    }

    if (messageId) {
      lastMessageId = messageId;
    }

    accumulatedText += text;
    yield text;
  }
}

export async function* streamChatWithAgent(
  params: ChatWithAgentParams,
): AsyncGenerator<ChatAgentStreamEvent> {
  const sessionId = params.sessionId ?? randomUUID();
  const agentContext = await resolveChatAgentContext({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });

  yield { type: "session", sessionId };

  await upsertChatAgentSession({
    sessionId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    agentId: params.agentId,
    message: params.message,
  });

  let fullMessage = "";

  for await (const token of streamChatAgentTokens(
    params,
    sessionId,
    agentContext,
  )) {
    fullMessage += token;
    yield { type: "token", content: token };
  }

  yield {
    type: "done",
    sessionId,
    message: fullMessage.trim() || "I am not sure how to answer that yet.",
  };
}
