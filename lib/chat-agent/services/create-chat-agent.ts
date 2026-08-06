import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

import { createChatModel, parseChatModel } from "@/lib/langchain/models/create-chat-model";

import { buildChatAgentSystemPrompt } from "../constants";
import { buildChatAgentSkillsPrompt } from "../skills/build-chat-agent-skills";
import { chatAgentContextSchema, type ChatAgentContext } from "../schema";
import { buildChatAgentTools } from "../tools/build-chat-agent-tools";
import { getChatAgentCheckpointer } from "../utils/get-chat-agent-checkpointer";

type ChatAgent = Awaited<ReturnType<typeof buildChatAgent>>;

let agentPromise: Promise<ChatAgent> | null = null;

function getDefaultChatModel() {
  return parseChatModel(process.env.CHAT_AGENT_MODEL);
}

async function buildChatAgent() {
  const [checkpointer, model] = await Promise.all([
    getChatAgentCheckpointer(),
    Promise.resolve(createChatModel(getDefaultChatModel(), { temperature: 0.5 })),
  ]);

  return createAgent({
    model,
    tools: buildChatAgentTools(),
    contextSchema: chatAgentContextSchema,
    middleware: [
      dynamicSystemPromptMiddleware<ChatAgentContext>(() =>
        [buildChatAgentSystemPrompt(), buildChatAgentSkillsPrompt()]
          .filter(Boolean)
          .join("\n\n"),
      ),
    ],
    checkpointer,
  });
}

export function getChatAgent(): Promise<ChatAgent> {
  if (!agentPromise) {
    agentPromise = buildChatAgent();
  }

  return agentPromise;
}
