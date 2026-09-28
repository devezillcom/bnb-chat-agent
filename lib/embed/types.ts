import type { ChatAgentMessage } from "@/lib/chat-agent/schema";

export type WebsiteEmbedConnection = {
  connectionId: string;
  workspaceId: string;
  agentId: string;
  agentName: string;
  firstMessage: string | null;
  allowedOrigin: string;
};

export type EmbedTokenPayload = {
  connectionId: string;
  exp: number;
};

export type BootstrapWebsiteEmbedParams = {
  publicKey: string;
  origin: string;
  clientKey: string;
};

export type BootstrapWebsiteEmbedResult = {
  token: string;
  expiresAt: string;
};

export type GetWebsiteEmbedSessionParams = {
  token: string;
  visitorId?: string;
};

export type GetWebsiteEmbedSessionResult = {
  agentName: string;
  firstMessage: string | null;
  sessionId: string | null;
  messages: ChatAgentMessage[];
};

export type StreamWebsiteEmbedMessageParams = {
  token: string;
  visitorId: string;
  message: string;
};
