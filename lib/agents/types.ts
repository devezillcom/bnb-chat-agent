import type { ChatModelId } from "@/lib/langchain/models/registry";

import type { SkillFormValues } from "@/lib/skills/schema";
import type { CreateToolFormValues } from "@/lib/tools/schema";

import type { CreateAgentFormValues } from "./schema";

export type AgentListItem = {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: ChatModelId;
  firstMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentListItemWithCapabilities = AgentListItem & {
  tools: string[];
  skills: string[];
  knowledgeBases: string[];
};

export type ListAgentsParams = {
  workspaceId: string;
  limit: number;
  offset: number;
  keyword?: string;
  sortKey?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
};

export type ListAgentsResult = {
  items: AgentListItemWithCapabilities[];
  nextOffset: number | null;
  total: number;
};

export type GetAgentParams = {
  workspaceId: string;
  agentId: string;
};

export type GetAgentResult = AgentListItem;

export type AgentMentionItem = {
  id: string;
  type: "tool" | "skill";
  /** Label inserted after `@` in the prompt editor. */
  name: string;
  /** Rewritten value in the runtime system prompt, wrapped in backticks. */
  slug: string;
};

export type AssignAgentCapabilityParams = {
  workspaceId: string;
  agentId: string;
  capabilityId: string;
};

export type AssignAgentCapabilityResult = {
  message: string;
};

export type CreateAgentToolParams = CreateToolFormValues & {
  workspaceId: string;
  agentId: string;
};

export type CreateAgentToolResult = {
  id: string;
  message: string;
};

export type CreateAgentSkillParams = SkillFormValues & {
  workspaceId: string;
  agentId: string;
};

export type CreateAgentSkillResult = {
  id: string;
  message: string;
};

export type CreateAgentParams = CreateAgentFormValues & {
  workspaceId: string;
};

export type CreateAgentResult = {
  id: string;
  message: string;
};

export type UpdateAgentParams = CreateAgentFormValues & {
  workspaceId: string;
  agentId: string;
};

export type UpdateAgentResult = {
  message: string;
};

export type DeleteAgentParams = {
  workspaceId: string;
  agentId: string;
};

export type DeleteAgentResult = {
  message: string;
};
