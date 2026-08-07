import "server-only";

import { buildChatAgentHumanMessage } from "@/lib/chat-agent/utils/build-chat-agent-human-message";
import { extractMessageContent } from "@/lib/chat-agent/utils/extract-message-content";

import type {
  ReplyToChannelMessageParams,
  ReplyToChannelMessageResult,
} from "../types";
import { createChannelAgentRunConfig } from "../utils/create-channel-agent-run-config";
import { getChannelAgent } from "./create-channel-agent";

export async function replyToChannelMessage(
  params: ReplyToChannelMessageParams,
): Promise<ReplyToChannelMessageResult> {
  const agent = await getChannelAgent({
    agentId: params.agent.id,
    systemPrompt: params.agent.systemPrompt,
  });

  const runConfig = createChannelAgentRunConfig(params.sessionId, params.context);
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
    message: message || "I am not sure how to answer that yet.",
  };
}
