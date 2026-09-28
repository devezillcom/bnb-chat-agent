import { randomUUID } from "crypto";

import type { ChatAgentImageAttachment, ChatAgentRunContext } from "../schema";
import type { ChatAgentStreamEvent, ChatWithAgentParams } from "../types";
import { buildChatAgentHumanMessage } from "../utils/build-chat-agent-human-message";
import { createAgentRunConfig } from "../utils/create-agent-run-config";
import { extractMessageContent } from "../utils/extract-message-content";
import { getChatAgent } from "./create-chat-agent";
import {
  resolveChatAgentContext,
  type ResolveChatAgentContextResult,
} from "./resolve-chat-agent-context";
import { upsertInAppAgentSession } from "./upsert-agent-session";

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

export async function* streamAgentTurnTokens(params: {
  message: string;
  images?: ChatAgentImageAttachment[];
  workspaceId: string;
  sessionId: string;
  agentContext: ResolveChatAgentContextResult;
  runContext: ChatAgentRunContext;
}): AsyncGenerator<string> {
  const agent = await getChatAgent(params.agentContext);
  const runConfig = createAgentRunConfig(params.sessionId, params.runContext);

  const humanMessage = await buildChatAgentHumanMessage(
    params.message,
    params.images,
    params.workspaceId,
    params.agentContext.model,
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
    chatEnv: params.chatEnv,
  });

  yield { type: "session", sessionId };

  await upsertInAppAgentSession({
    sessionId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    agentId: params.agentId,
    chatEnv: params.chatEnv,
    message: params.message,
  });

  let fullMessage = "";

  for await (const token of streamAgentTurnTokens({
    message: params.message,
    images: params.images,
    workspaceId: params.workspaceId,
    sessionId,
    agentContext,
    runContext: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      agentId: params.agentId,
      chatEnv: params.chatEnv,
    },
  })) {
    fullMessage += token;
    yield { type: "token", content: token };
  }

  yield {
    type: "done",
    sessionId,
    message: fullMessage.trim() || "I am not sure how to answer that yet.",
  };
}
