import { z } from "zod";

import { bienhinhCreateImageTool } from "./bienhinh-create-image/definition";
import { builtinTool } from "./builtin/definition";
import { httpApiTool } from "./http-api/definition";
import { mcpTool } from "./mcp/definition";
import type {
  ToolConfigFieldDefinition,
  ToolDefinition,
} from "./registry-types";
import { webResearchTool } from "./web-research/definition";
import { dataShapeToJsonSchema } from "./utils/data-shape";
import { dataShapeToZodSchema } from "./utils/data-shape-to-zod-schema";

export type {
  ToolConfigFieldDefinition,
  ToolConfigFieldOption,
  ToolConfigFieldShowWhen,
  ToolConfigFieldType,
  ToolDefinition,
} from "./registry-types";

export const TOOL_REGISTRY_METADATA: ToolDefinition[] = [
  httpApiTool,
  mcpTool,
  webResearchTool,
  builtinTool,
  bienhinhCreateImageTool,
];

export const TOOL_REGISTRY_IDS = TOOL_REGISTRY_METADATA.map((entry) => entry.id);

export type ToolRegistryId = (typeof TOOL_REGISTRY_IDS)[number];

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return TOOL_REGISTRY_METADATA.find((entry) => entry.id === toolId);
}

export function isKnownToolRegistryId(
  toolId: string,
): toolId is ToolRegistryId {
  return TOOL_REGISTRY_METADATA.some((entry) => entry.id === toolId);
}

export function getToolInputZodSchema(toolId: string): z.ZodType {
  const definition = getToolDefinition(toolId);
  if (!definition) {
    return z.object({});
  }

  if (definition.inputZodSchema) {
    return definition.inputZodSchema;
  }

  return dataShapeToZodSchema(definition.inputShape);
}

export function getToolInputSchema(
  toolId: string,
): Record<string, unknown> {
  const definition = getToolDefinition(toolId);
  if (!definition) {
    return { type: "object", properties: {} };
  }

  if (definition.inputJsonSchema) {
    return definition.inputJsonSchema;
  }

  return dataShapeToJsonSchema(definition.inputShape);
}

export function getToolOutputSchema(
  toolId: string,
): Record<string, unknown> | null {
  const definition = getToolDefinition(toolId);
  if (!definition?.outputShape?.fields.length) {
    return null;
  }

  return dataShapeToJsonSchema(definition.outputShape);
}
