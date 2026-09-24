import "server-only";

import { bienhinhCreateImageToolRuntime } from "./bienhinh-create-image/runtime";
import { builtinToolRuntime } from "./builtin/runtime";
import { httpApiToolRuntime } from "./http-api/runtime";
import { mcpToolRuntime } from "./mcp/runtime";
import type { ToolRuntimeHandlers } from "./registry-runtime-types";
import type { RegisteredTool } from "./registry-types";
import {
  TOOL_REGISTRY_METADATA,
} from "./tool-registry-metadata";
import { webResearchToolRuntime } from "./web-research/runtime";

export type {
  RegisteredTool,
  ToolConfigFieldDefinition,
  ToolConfigFieldOption,
  ToolConfigFieldShowWhen,
  ToolConfigFieldType,
  ToolDefinition,
  BuildChatAgentToolsForWorkspaceParams,
  ExecuteRegisteredToolParams,
} from "./registry-types";

export {
  getToolInputSchema,
  getToolInputZodSchema,
  getToolOutputSchema,
  isKnownToolRegistryId,
  TOOL_REGISTRY_IDS,
  type ToolRegistryId,
} from "./tool-registry-metadata";

const TOOL_RUNTIMES: Record<string, ToolRuntimeHandlers> = {
  http_api: httpApiToolRuntime,
  mcp: mcpToolRuntime,
  web_research: webResearchToolRuntime,
  builtin: builtinToolRuntime,
  bienhinh_create_image: bienhinhCreateImageToolRuntime,
};

export const TOOL_REGISTRY: RegisteredTool[] = TOOL_REGISTRY_METADATA.map(
  (definition) => ({
    ...definition,
    ...TOOL_RUNTIMES[definition.id],
  }),
);

export function getRegisteredTool(
  toolId: string,
): RegisteredTool | undefined {
  return TOOL_REGISTRY.find((entry) => entry.id === toolId);
}

export function getToolDefinition(toolId: string): RegisteredTool | undefined {
  return getRegisteredTool(toolId);
}
