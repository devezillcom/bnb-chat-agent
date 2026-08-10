import { z } from "zod";

import {
  bienhinhCreateImageInputJsonSchema,
  bienhinhCreateImageInputSchema,
} from "./schemas/bienhinh-create-image-input-schema";
import type { DataShape } from "./utils/data-shape";
import { dataShapeToJsonSchema } from "./utils/data-shape";
import { dataShapeToZodSchema } from "./utils/data-shape-to-zod-schema";

export type ToolConfigFieldDefinition = {
  key: string;
  label: string;
  description?: string;
  /** Render as password input when true. */
  secret?: boolean;
  required?: boolean;
  /** Pre-filled in create/edit forms when the field is empty. */
  defaultValue?: string;
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
  configSchema: z.ZodType<Record<string, string>>;
  /** Form metadata for config fields (labels, secrets). */
  configFields: ToolConfigFieldDefinition[];
};

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: "http_api",
    name: "HTTP API",
    description: "Call an external HTTP API using a base URL and credentials.",
    configSchema: z.object({
      base_url: z.string().trim().min(1, { error: "Base URL is required." }),
      api_key: z.string().trim().min(1, { error: "API key is required." }),
    }),
    configFields: [
      {
        key: "base_url",
        label: "Base URL",
        description: "Root URL for API requests.",
        required: true,
      },
      {
        key: "api_key",
        label: "API key",
        description: "Bearer token or API key sent with requests.",
        secret: true,
        required: true,
      },
    ],
    inputShape: {
      fields: [
        {
          name: "method",
          type: "string",
          description: "HTTP method, e.g. GET or POST.",
          required: true,
        },
        {
          name: "path",
          type: "string",
          description: "Request path relative to the base URL.",
          required: true,
        },
        {
          name: "body",
          type: "string",
          description: "Optional JSON request body.",
          required: false,
        },
      ],
    },
    outputShape: {
      fields: [
        {
          name: "status",
          type: "integer",
          description: "HTTP status code.",
          required: true,
        },
        {
          name: "body",
          type: "string",
          description: "Response body.",
          required: true,
        },
      ],
    },
  },
  {
    id: "mcp",
    name: "MCP",
    description: "Connect to a Model Context Protocol server.",
    configSchema: z.object({
      server_url: z
        .string()
        .trim()
        .min(1, { error: "Server URL is required." }),
    }),
    configFields: [
      {
        key: "server_url",
        label: "Server URL",
        description: "URL of the MCP server endpoint.",
        required: true,
      },
    ],
    inputShape: {
      fields: [
        {
          name: "tool_name",
          type: "string",
          description: "MCP tool name to invoke.",
          required: true,
        },
        {
          name: "arguments",
          type: "string",
          description: "JSON-encoded arguments for the MCP tool.",
          required: false,
        },
      ],
    },
  },
  {
    id: "builtin",
    name: "Built-in",
    description: "Platform-provided tool with no extra configuration.",
    configSchema: z.object({}),
    configFields: [],
    inputShape: {
      fields: [
        {
          name: "query",
          type: "string",
          description: "Input passed to the built-in handler.",
          required: true,
        },
      ],
    },
  },
  {
    id: "bienhinh_create_image",
    name: "Bienhinh/createImage",
    description:
      "Generate an image via Bienhinh using user provided reference images from attachments.",
    configSchema: z.object({
      projectId: z
        .string()
        .trim()
        .min(1, { error: "Project ID is required." }),
      templateGroupId: z
        .string()
        .trim()
        .default("default-template-group"),
      templateId: z
        .string()
        .trim()
        .min(1, { error: "Template ID is required." }),
      styleId: z.string().trim().min(1, { error: "Style ID is required." }),
      imageWorkflow: z.string().trim().default("standard-image"),
      outputAspectRatio: z.string().trim().default("4:5"),
      "fields.projectName": z.string().trim().optional(),
      "fields.phone": z.string().trim().optional(),
      "fields.headline": z.string().trim().optional(),
      "fields.extraPrompt": z.string().trim().optional(),
    }),
    configFields: [
      {
        key: "projectId",
        label: "Project ID",
        required: true,
      },
      {
        key: "templateGroupId",
        label: "Template group ID",
        defaultValue: "default-template-group",
      },
      {
        key: "templateId",
        label: "Template ID",
        required: true,
      },
      {
        key: "styleId",
        label: "Style ID",
        required: true,
      },
      {
        key: "imageWorkflow",
        label: "Image workflow",
        defaultValue: "standard-image",
      },
      {
        key: "outputAspectRatio",
        label: "Output aspect ratio",
        defaultValue: "4:5",
      },
      {
        key: "fields.projectName",
        label: "Project name",
        description: "Optional value sent in the fields.projectName payload.",
      },
      {
        key: "fields.phone",
        label: "Phone",
        description: "Optional value sent in the fields.phone payload.",
      },
      {
        key: "fields.headline",
        label: "Headline",
        description: "Optional value sent in the fields.headline payload.",
      },
      {
        key: "fields.extraPrompt",
        label: "Extra prompt",
        description: "Optional value sent in the fields.extraPrompt payload.",
      },
    ],
    inputShape: { fields: [] },
    inputZodSchema: bienhinhCreateImageInputSchema,
    inputJsonSchema: bienhinhCreateImageInputJsonSchema,
    outputShape: {
      fields: [
        {
          name: "status",
          type: "integer",
          description: "HTTP status code.",
          required: true,
        },
        {
          name: "body",
          type: "string",
          description: "Response body from Bienhinh.",
          required: true,
        },
      ],
    },
  },
];

export const TOOL_REGISTRY_IDS = TOOL_REGISTRY.map((entry) => entry.id);

export type ToolRegistryId = (typeof TOOL_REGISTRY_IDS)[number];

export function getToolDefinition(
  toolId: string,
): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((entry) => entry.id === toolId);
}

export function isKnownToolRegistryId(
  toolId: string,
): toolId is ToolRegistryId {
  return TOOL_REGISTRY.some((entry) => entry.id === toolId);
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
