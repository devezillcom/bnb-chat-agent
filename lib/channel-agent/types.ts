import type { ChatAgentImageAttachment } from "@/lib/chat-agent/schema";

import type { ChannelAgentContext } from "./schema";

export type { ChannelAgentContext };

export type ReplyToChannelMessageParams = {
  sessionId: string;
  message: string;
  images?: ChatAgentImageAttachment[];
  agent: {
    id: string;
    systemPrompt: string;
  };
  context: ChannelAgentContext;
};

export type ReplyToChannelMessageResult = {
  message: string;
};
