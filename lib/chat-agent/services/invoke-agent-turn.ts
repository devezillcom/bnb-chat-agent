import type { ChatAgentImageAttachment, ChatAgentRunContext } from "../schema";
import { buildChatAgentHumanMessage } from "../utils/build-chat-agent-human-message";
import { createAgentRunConfig } from "../utils/create-agent-run-config";
import { extractMessageContent } from "../utils/extract-message-content";
import type { ResolveChatAgentContextResult } from "./resolve-chat-agent-context";
import { getChatAgent } from "./create-chat-agent";

const FALLBACK_MESSAGE = "I am not sure how to answer that yet.";

export type InvokeAgentTurnParams = {
  sessionId: string;
  message: string;
  images?: ChatAgentImageAttachment[];
  agentContext: ResolveChatAgentContextResult;
  runContext: ChatAgentRunContext;
};

export type InvokeAgentTurnResult = {
  message: string;
};

export async function invokeAgentTurn(
  params: InvokeAgentTurnParams,
): Promise<InvokeAgentTurnResult> {
  const agent = await getChatAgent(params.agentContext);
  const runConfig = createAgentRunConfig(params.sessionId, params.runContext);
  const humanMessage = await buildChatAgentHumanMessage(
    params.message,
    params.images,
    params.runContext.workspaceId,
    params.agentContext.model,
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
    message: message || FALLBACK_MESSAGE,
  };
}
