import { randomUUID } from "crypto";

import { resolveChatEnvRuntime } from "../config/chat-env";
import type { ChatWithAgentParams, ChatWithAgentResult } from "../types";
import { createAgentRunConfig } from "../utils/create-agent-run-config";
import { invokeAgentTurn } from "./invoke-agent-turn";
import { resolveChatAgentContext } from "./resolve-chat-agent-context";
import { upsertInAppAgentSession } from "./upsert-agent-session";

export async function chatWithAgent(
  params: ChatWithAgentParams,
): Promise<ChatWithAgentResult> {
  const sessionId = params.sessionId ?? randomUUID();
  const agentContext = await resolveChatAgentContext({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
    chatEnv: params.chatEnv,
  });

  await upsertInAppAgentSession({
    sessionId,
    workspaceId: params.workspaceId,
    userId: params.userId,
    agentId: params.agentId,
    chatEnv: params.chatEnv,
    message: params.message,
  });

  const result = await invokeAgentTurn({
    sessionId,
    message: params.message,
    images: params.images,
    agentContext,
    runContext: {
      userId: params.userId,
      workspaceId: params.workspaceId,
      agentId: params.agentId,
      chatEnv: params.chatEnv,
    },
  });

  return {
    sessionId,
    message: result.message,
  };
}

export function shouldStreamChatEnv(chatEnv: ChatWithAgentParams["chatEnv"]) {
  return resolveChatEnvRuntime(chatEnv).delivery === "stream";
}
