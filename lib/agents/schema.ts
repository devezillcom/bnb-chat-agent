import { z } from "zod";

import { chatModelIdSchema } from "@/lib/langchain/models/registry";

import {
  AGENT_CONVERSATION_STARTER_MAX_COUNT,
  AGENT_CONVERSATION_STARTER_MAX_LENGTH,
} from "./constants";

const agentNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Agent name is required." });

const agentSystemPromptSchema = z
  .string()
  .trim()
  .min(1, { error: "System prompt is required." });

const conversationStarterTextSchema = z
  .string()
  .trim()
  .min(1, { error: "Conversation starter cannot be empty." })
  .max(AGENT_CONVERSATION_STARTER_MAX_LENGTH, {
    error: `Conversation starter must be ${AGENT_CONVERSATION_STARTER_MAX_LENGTH} characters or fewer.`,
  });

export const conversationStartersSchema = z
  .array(conversationStarterTextSchema)
  .max(AGENT_CONVERSATION_STARTER_MAX_COUNT, {
    error: `Add up to ${AGENT_CONVERSATION_STARTER_MAX_COUNT} conversation starters.`,
  });

const agentAvatarUrlSchema = z
  .url({ error: "Avatar URL must be valid." })
  .nullable();

export const createAgentFormSchema = z.object({
  name: agentNameSchema,
  description: z.string().trim().optional(),
  systemPrompt: agentSystemPromptSchema,
  model: chatModelIdSchema,
  firstMessage: z.string().trim().optional(),
});

export const agentBasicsFormSchema = z.object({
  name: agentNameSchema,
  description: z.string().trim().optional(),
  model: chatModelIdSchema,
  avatarUrl: agentAvatarUrlSchema,
});

export const agentGreetingFormSchema = z.object({
  firstMessage: z.string().trim().optional(),
  conversationStarters: z
    .array(
      z.object({
        text: z.string().trim().max(AGENT_CONVERSATION_STARTER_MAX_LENGTH, {
          error: `Conversation starter must be ${AGENT_CONVERSATION_STARTER_MAX_LENGTH} characters or fewer.`,
        }),
      }),
    )
    .max(AGENT_CONVERSATION_STARTER_MAX_COUNT, {
      error: `Add up to ${AGENT_CONVERSATION_STARTER_MAX_COUNT} conversation starters.`,
    }),
});

export const agentInstructionsFormSchema = z.object({
  systemPrompt: agentSystemPromptSchema,
});

export const updateAgentRequestSchema = z
  .object({
    name: agentNameSchema.optional(),
    description: z.string().trim().optional(),
    systemPrompt: agentSystemPromptSchema.optional(),
    model: chatModelIdSchema.optional(),
    firstMessage: z.string().trim().optional(),
    avatarUrl: agentAvatarUrlSchema.optional(),
    conversationStarters: conversationStartersSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.systemPrompt !== undefined ||
      value.model !== undefined ||
      value.firstMessage !== undefined ||
      value.avatarUrl !== undefined ||
      value.conversationStarters !== undefined,
    { error: "No changes to save." },
  );

export type CreateAgentFormValues = z.infer<typeof createAgentFormSchema>;
export type AgentBasicsFormValues = z.infer<typeof agentBasicsFormSchema>;
export type AgentGreetingFormValues = z.infer<typeof agentGreetingFormSchema>;
export type AgentInstructionsFormValues = z.infer<
  typeof agentInstructionsFormSchema
>;
export type UpdateAgentRequest = z.infer<typeof updateAgentRequestSchema>;
