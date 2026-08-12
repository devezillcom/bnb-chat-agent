import type { ChatModelId } from "@/lib/langchain/models/registry";

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

export type ListAgentsParams = {
  workspaceId: string;
  limit: number;
  offset: number;
  keyword?: string;
  sortKey?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
};

export type ListAgentsResult = {
  items: AgentListItem[];
  nextOffset: number | null;
  total: number;
};

export type GetAgentParams = {
  workspaceId: string;
  agentId: string;
};

export type GetAgentResult = AgentListItem;

export type AssignAgentCapabilityParams = {
  workspaceId: string;
  agentId: string;
  capabilityId: string;
};

export type AssignAgentCapabilityResult = {
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
