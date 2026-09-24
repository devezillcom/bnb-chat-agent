import type { StructuredToolInterface } from "@langchain/core/tools";
import type { z } from "zod";

import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";

import type { DataShape } from "./utils/data-shape";
import type { WorkspaceToolRuntime } from "./types";

export type ToolConfigFieldType = "text" | "textarea" | "select" | "radio";

export type ToolConfigFieldOption = {
  value: string;
  label: string;
  description?: string;
};

export type ToolConfigFieldShowWhen = {
  key: string;
  values: string[];
};

export type ToolConfigFieldDefinition = {
  key: string;
  label: string;
  description?: string;
  /** Render as password input when true. */
  secret?: boolean;
  required?: boolean;
  /** Pre-filled in create/edit forms when the field is empty. */
  defaultValue?: string;
  type?: ToolConfigFieldType;
  placeholder?: string;
  options?: ToolConfigFieldOption[];
  showWhen?: ToolConfigFieldShowWhen | ToolConfigFieldShowWhen[];
};

export type ToolDefinition = {
  /** Stable registry identifier — all tools are defined in code. */
  id: string;
  name: string;
  description: string;
  /** Fixed input JSON Schema for the runtime AI agent. */
  inputShape: DataShape;
  /** Optional Zod schema when inputShape cannot express the tool input. */
  inputZodSchema?: z.ZodType;
  /** Optional JSON Schema override paired with inputZodSchema. */
  inputJsonSchema?: Record<string, unknown>;
  /** Fixed output JSON Schema for the runtime AI agent. */
  outputShape?: DataShape;
  /** Validates workspace config when adding this tool. */
  configSchema: z.ZodType<Record<string, unknown>>;
  /** Form metadata for config fields (labels, secrets). */
  configFields: ToolConfigFieldDefinition[];
};

export type BuildChatAgentToolsForWorkspaceParams = {
  workspaceTool: WorkspaceToolRuntime;
};

export type ExecuteRegisteredToolParams = {
  tool: WorkspaceToolRuntime;
  input: Record<string, unknown>;
  sessionId?: string;
  runContext?: ChatAgentRunContext;
};

export type RegisteredTool = ToolDefinition & {
  /** Build one or more LangChain tools for the agent runtime. */
  buildChatAgentTools?: (
    params: BuildChatAgentToolsForWorkspaceParams,
  ) => StructuredToolInterface[] | Promise<StructuredToolInterface[]>;
  /** Execute the tool when using the default single-tool path (slug-named tool). */
  execute?: (params: ExecuteRegisteredToolParams) => Promise<string>;
};
