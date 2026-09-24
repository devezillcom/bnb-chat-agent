import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";

import type { CreateToolFormValues } from "./schema";
import type {
  ToolConfigFieldDefinition,
  ToolRegistryId,
} from "./tool-registry-metadata";

export type ToolExecutionContext = {
  sessionId?: string;
  runContext?: ChatAgentRunContext;
};

export type ToolListItem = {
  id: string;
  name: string;
  registryToolId: ToolRegistryId;
  description: string | null;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ToolDetail = ToolListItem & {
  config: Record<string, unknown>;
};

export type AgentToolItem = {
  id: string;
  name: string;
  registryToolId: string;
  description: string | null;
  config: Record<string, unknown>;
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
  configFields: ToolConfigFieldDefinition[];
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

export type WorkspaceToolRecord = {
  id: string;
  name: string;
  description: string;
  registryToolId: ToolRegistryId;
  config: Record<string, unknown>;
};

/**
 * A workspace tool plus the slug derived from its name for the current agent.
 * Single-tool registries use this slug as the LangChain tool name; multi-tool
 * registries prefix their child tool names with it.
 */
export type WorkspaceToolRuntime = WorkspaceToolRecord & {
  slug: string;
};

export type ListToolsByIdsParams = {
  workspaceId: string;
  toolIds: string[];
};

export type ListToolsByIdsResult = WorkspaceToolRecord[];

export type McpAdvertisedToolItem = {
  name: string;
  description: string;
};

export type ListMcpAdvertisedToolsParams = {
  workspaceId: string;
  toolId: string;
};

export type ListMcpAdvertisedToolsResult = {
  items: McpAdvertisedToolItem[];
};

export type McpAvailableToolItem = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type ListMcpAvailableToolsParams = {
  config: Record<string, unknown>;
};

export type ListMcpAvailableToolsResult = {
  items: McpAvailableToolItem[];
};
