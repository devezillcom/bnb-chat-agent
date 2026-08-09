import "server-only";

import { buildChatAgentHumanMessage } from "@/lib/chat-agent/utils/build-chat-agent-human-message";
import { resolveWorkspaceAgentRuntime } from "@/lib/chat-agent/utils/resolve-workspace-agent-runtime";
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
  const runtime = await resolveWorkspaceAgentRuntime({
    agentId: params.agent.id,
    workspaceId: params.context.workspaceId,
    systemPrompt: params.agent.systemPrompt,
  });

  const agent = await getChannelAgent({
    agentId: params.agent.id,
    workspaceId: params.context.workspaceId,
    systemPrompt: runtime.systemPrompt,
    toolSlugs: runtime.toolSlugs,
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
