import { z } from "zod";

import { CHAT_AGENT_IMAGE_MAX_COUNT } from "./constants/chat-agent-image-upload-rules";

export const chatAgentImageAttachmentSchema = z.object({
  url: z.string().url(),
  key: z.string().optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional(),
});

export const chatAgentImageUploadUrlRequestSchema = z.object({
  contentType: z.string().trim().min(1, { error: "Content type is required." }),
  contentLength: z.int().positive({ error: "Image size is required." }),
});

export const chatAgentMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  images: z.array(chatAgentImageAttachmentSchema).optional(),
});

export const chatWithAgentRequestSchema = z
  .object({
    agentId: z.uuid({ error: "Agent is required." }),
    sessionId: z.string().uuid().optional(),
    message: z.string().trim(),
    images: z
      .array(chatAgentImageAttachmentSchema)
      .max(CHAT_AGENT_IMAGE_MAX_COUNT)
      .optional(),
  })
  .refine(
    (data) => data.message.length > 0 || (data.images?.length ?? 0) > 0,
    { message: "Message or at least one image is required." },
  );

export const chatAgentConfigSchema = z.object({
  agentId: z.uuid(),
  workspaceId: z.uuid(),
  systemPrompt: z.string(),
  toolSlugs: z.array(z.string()).default([]),
  knowledgeBaseIds: z.array(z.uuid()).default([]),
  citationsEnabled: z.boolean().default(true),
});

export const chatAgentContextSchema = z.object({
  userId: z.uuid(),
  workspaceId: z.uuid(),
  agentId: z.uuid(),
});

export type ChatAgentImageAttachment = z.infer<
  typeof chatAgentImageAttachmentSchema
>;
export type ChatAgentImageUploadUrlRequest = z.infer<
  typeof chatAgentImageUploadUrlRequestSchema
>;
export type ChatAgentMessage = z.infer<typeof chatAgentMessageSchema>;
export type ChatWithAgentRequest = z.infer<typeof chatWithAgentRequestSchema>;
export type ChatAgentConfig = z.infer<typeof chatAgentConfigSchema>;
export type ChatAgentContext = z.infer<typeof chatAgentContextSchema>;
