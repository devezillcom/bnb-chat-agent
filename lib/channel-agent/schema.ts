import { z } from "zod";

export const channelAgentContextSchema = z.object({
  workspaceId: z.uuid(),
  connectionId: z.uuid(),
  agentId: z.uuid(),
  channelType: z.string(),
  externalParticipantId: z.string(),
});

export type ChannelAgentContext = z.infer<typeof channelAgentContextSchema>;

export const channelAgentConfigSchema = z.object({
  agentId: z.uuid(),
  systemPrompt: z.string(),
});

export type ChannelAgentConfig = z.infer<typeof channelAgentConfigSchema>;
