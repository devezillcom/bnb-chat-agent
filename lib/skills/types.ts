import type { SkillFormValues } from "./schema";

export type AgentSkillItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tools: string[];
  instructions: string;
};

export type ListAgentSkillsParams = {
  agentId: string;
  workspaceId: string;
};

export type ListAgentSkillsResult = AgentSkillItem[];

export type SkillListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tools: string[];
  agentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SkillDetail = SkillListItem & {
  instructions: string;
};

export type ListSkillsParams = {
  workspaceId: string;
  limit: number;
  offset: number;
  keyword?: string;
  sortKey?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
};

export type ListSkillsResult = {
  items: SkillListItem[];
  nextOffset: number | null;
  total: number;
};

export type GetSkillParams = {
  workspaceId: string;
  skillId: string;
};

export type GetSkillResult = SkillDetail;

export type CreateSkillParams = SkillFormValues & {
  workspaceId: string;
};

export type CreateSkillResult = {
  id: string;
  message: string;
};

export type UpdateSkillParams = SkillFormValues & {
  workspaceId: string;
  skillId: string;
};

export type UpdateSkillResult = {
  message: string;
};

export type DeleteSkillParams = {
  workspaceId: string;
  skillId: string;
};

export type DeleteSkillResult = {
  message: string;
};
