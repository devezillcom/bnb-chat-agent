import { z } from "zod";

import { activeChatEnvSchema } from "@/lib/chat-agent/config/chat-env";

const bienhinhImagePollInAppRunContextSchema = z.object({
  workspaceId: z.uuid(),
  agentId: z.uuid(),
  chatEnv: activeChatEnvSchema,
  userId: z.uuid(),
});

const bienhinhImagePollChannelRunContextSchema = z.object({
  workspaceId: z.uuid(),
  agentId: z.uuid(),
  chatEnv: activeChatEnvSchema,
  connectionId: z.uuid(),
  channelType: z.string().trim().min(1),
  externalParticipantId: z.string().trim().min(1),
});

export const bienhinhImagePollQstashPayloadSchema = z.object({
  requestId: z.string().trim().min(1),
  sessionId: z.string().uuid(),
  runContext: z.union([
    bienhinhImagePollInAppRunContextSchema,
    bienhinhImagePollChannelRunContextSchema,
  ]),
  attempt: z.int().nonnegative().default(0),
  maxAttempts: z.int().positive().default(100),
});

export type BienhinhImagePollQstashPayload = z.infer<
  typeof bienhinhImagePollQstashPayloadSchema
>;
