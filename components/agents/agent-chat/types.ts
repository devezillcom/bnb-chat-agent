import type { ChatAgentImageAttachment } from "@/lib/chat-agent/schema";

export type AgentChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  images?: ChatAgentImageAttachment[];
};

export type PendingChatImage = {
  id: string;
  file: File;
  fileName: string;
  mimeType: string;
  previewUrl: string;
  uploadState: "uploading" | "ready" | "error";
  url?: string;
  key?: string;
  error?: string;
};
