import type {
  ChatAgentImageAttachment,
  ChatAgentMessage,
  ChatWithAgentRequest,
} from "./schema";
import type { ActiveChatEnv } from "./config/chat-env";

export type { ChatAgentMessage, ChatWithAgentRequest };
export type { ActiveChatEnv, ChatEnv } from "./config/chat-env";

export type ChatWithAgentParams = ChatWithAgentRequest & {
  workspaceId: string;
  userId: string;
};

export type ChatWithAgentResult = {
  sessionId: string;
  message: string;
};

export type ChatAgentStreamEvent =
  | { type: "session"; sessionId: string }
  | { type: "token"; content: string }
  | { type: "done"; sessionId: string; message: string }
  | { type: "error"; message: string };

export type ListChatAgentSessionsParams = {
  workspaceId: string;
  userId: string;
  agentId: string;
  chatEnv: ActiveChatEnv;
  limit: number;
  keyword?: string;
};

export type ChatAgentSessionListItem = {
  id: string;
  title: string;
  chatEnv: ActiveChatEnv;
  createdAt: string;
  updatedAt: string;
};

export type ListChatAgentSessionsResult = {
  items: ChatAgentSessionListItem[];
};

export type GetChatAgentSessionMessagesParams = {
  sessionId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  chatEnv: ActiveChatEnv;
};

export type GetChatAgentSessionMessagesResult = {
  sessionId: string;
  chatEnv: ActiveChatEnv;
  messages: ChatAgentMessage[];
};

export type ReplyToChannelMessageParams = {
  sessionId: string;
  message: string;
  images?: ChatAgentImageAttachment[];
  chatEnv: ActiveChatEnv;
  agent: {
    id: string;
    systemPrompt: string;
    model: string;
  };
  context: {
    workspaceId: string;
    agentId: string;
    chatEnv: ActiveChatEnv;
    connectionId: string;
    channelType: string;
    externalParticipantId: string;
  };
};

export type ReplyToChannelMessageResult = {
  message: string;
};
