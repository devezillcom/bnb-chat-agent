import { randomUUID } from "crypto";

import type { ChatWithAgentParams, ChatWithAgentResult } from "../types";
import { buildChatAgentHumanMessage } from "../utils/build-chat-agent-human-message";
import { createChatAgentRunConfig } from "../utils/create-chat-agent-run-config";
import { extractMessageContent } from "../utils/extract-message-content";
import { getChatAgent } from "./create-chat-agent";
import { resolveChatAgentContext } from "./resolve-chat-agent-context";
import { upsertChatAgentSession } from "./upsert-chat-agent-session";

export async function chatWithAgent(
  params: ChatWithAgentParams,
): Promise<ChatWithAgentResult> {
  const sessionId = params.sessionId ?? randomUUID();
  const agentContext = await resolveChatAgentContext({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });
  const agent = await getChatAgent(agentContext);
  const runConfig = createChatAgentRunConfig(sessionId, {
    userId: params.userId,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });

  await upsertChatAgentSession({
    sessionId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    agentId: params.agentId,
    message: params.message,
  });

  const humanMessage = await buildChatAgentHumanMessage(
    params.message,
    params.images,
  );

  const result = await agent.invoke(
    {
      messages: [humanMessage],
    },
    runConfig,
  );

  const lastMessage = result.messages.at(-1);
  const message = extractMessageContent(lastMessage?.content).trim();

  return {
    sessionId,
    message: message || "I am not sure how to answer that yet.",
  };
}
