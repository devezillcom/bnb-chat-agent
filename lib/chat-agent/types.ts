import type {
  ChatAgentContext,
  ChatAgentMessage,
  ChatWithAgentRequest,
} from "./schema";

export type { ChatAgentMessage, ChatWithAgentRequest, ChatAgentContext };

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
  limit: number;
  keyword?: string;
};

export type ChatAgentSessionListItem = {
  id: string;
  title: string;
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
};

export type GetChatAgentSessionMessagesResult = {
  sessionId: string;
  messages: ChatAgentMessage[];
};
