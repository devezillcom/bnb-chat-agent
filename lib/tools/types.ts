import type { CreateToolFormValues } from "./schema";
import type { ToolHandlerType } from "./tool-handler-registry";

export type ToolListItem = {
  id: string;
  name: string;
  handlerKey: string;
  handlerType: ToolHandlerType;
  description: string | null;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ToolDetail = ToolListItem & {
  config: Record<string, string>;
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
