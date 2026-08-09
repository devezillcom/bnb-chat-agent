import type { CreateToolFormValues } from "./schema";
import type { ToolRegistryId } from "./tool-registry";

export type ToolListItem = {
  id: string;
  name: string;
  slug: string;
  registryToolId: ToolRegistryId;
  description: string | null;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ToolDetail = ToolListItem & {
  config: Record<string, string>;
};

export type AgentToolItem = {
  id: string;
  name: string;
  slug: string;
  registryToolId: string;
  description: string | null;
};

export type ListAgentToolsParams = {
  workspaceId: string;
  agentId: string;
};

export type ListAgentToolsResult = AgentToolItem[];

export type ToolRegistryListItem = {
  id: ToolRegistryId;
  name: string;
  description: string;
  configFields: {
    key: string;
    label: string;
    description?: string;
    secret?: boolean;
    required?: boolean;
  }[];
};

export type ListToolsParams = {
  workspaceId: string;
  limit: number;
  offset: number;
  keyword?: string;
  sortKey?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
};

export type ListToolsResult = {
  items: ToolListItem[];
  nextOffset: number | null;
  total: number;
};

export type ListToolRegistryResult = {
  items: ToolRegistryListItem[];
};

export type GetToolParams = {
  workspaceId: string;
  toolId: string;
};

export type GetToolResult = ToolDetail;

export type CreateToolParams = CreateToolFormValues & {
  workspaceId: string;
};

export type CreateToolResult = {
  id: string;
  message: string;
};

export type UpdateToolParams = CreateToolFormValues & {
  workspaceId: string;
  toolId: string;
};

export type UpdateToolResult = {
  message: string;
};

export type DeleteToolParams = {
  workspaceId: string;
  toolId: string;
};

export type DeleteToolResult = {
  message: string;
};

export type WorkspaceToolRuntime = {
  slug: string;
  name: string;
  description: string;
  registryToolId: ToolRegistryId;
  config: Record<string, string>;
};

export type ListToolsBySlugsParams = {
  workspaceId: string;
  slugs: string[];
};

export type ListToolsBySlugsResult = WorkspaceToolRuntime[];
