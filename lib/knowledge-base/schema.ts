import { z } from "zod";

export const knowledgeBaseFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required." }),
  description: z.string().trim().optional(),
});

export const createKnowledgeBaseDocumentSchema = z.object({
  key: z.string().trim().min(1, { error: "Upload key is required." }),
  filename: z.string().trim().min(1, { error: "Filename is required." }),
  contentType: z.string().trim().min(1, { error: "Content type is required." }),
  contentLength: z.number().int().positive(),
});

export const knowledgeBaseDocumentUploadUrlSchema = z.object({
  filename: z.string().trim().min(1, { error: "Filename is required." }),
  contentType: z.string().trim().min(1, { error: "Content type is required." }),
  contentLength: z.number().int().positive(),
});

export const knowledgeBaseDocumentProcessQstashPayloadSchema = z.object({
  documentId: z.uuid(),
  workspaceId: z.uuid(),
  knowledgeBaseId: z.uuid(),
});

export type KnowledgeBaseFormValues = z.infer<typeof knowledgeBaseFormSchema>;
export type CreateKnowledgeBaseDocumentBody = z.infer<
  typeof createKnowledgeBaseDocumentSchema
>;
export type KnowledgeBaseDocumentUploadUrlBody = z.infer<
  typeof knowledgeBaseDocumentUploadUrlSchema
>;
export type KnowledgeBaseDocumentProcessQstashPayload = z.infer<
  typeof knowledgeBaseDocumentProcessQstashPayloadSchema
>;
