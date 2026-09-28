import type {
  ChatAgentImageAttachment,
  ChatAgentMessage,
} from "@/lib/chat-agent/schema";

export type WebsiteEmbedConnection = {
  connectionId: string;
  workspaceId: string;
  agentId: string;
  agentName: string;
  firstMessage: string | null;
  allowAllOrigins: boolean;
  allowedOrigins: string[];
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

export type EmbedRtdbStreamAuth = {
  streamUrl: string;
  authToken: string;
  expiresAt: string;
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
  notification: EmbedRtdbStreamAuth | null;
};

export type CreateEmbedImageUploadUrlParams = {
  token: string;
  visitorId: string;
  contentType: string;
  contentLength: number;
};

export type StreamWebsiteEmbedMessageParams = {
  token: string;
  visitorId: string;
  message: string;
  images?: ChatAgentImageAttachment[];
};
