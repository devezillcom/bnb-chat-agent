import { z } from "zod";

import type { DataShape } from "./utils/data-shape";
import { dataShapeToJsonSchema } from "./utils/data-shape";

export type ToolConfigFieldDefinition = {
  key: string;
  label: string;
  description?: string;
  /** Render as password input when true. */
  secret?: boolean;
  required?: boolean;
};

export type ToolDefinition = {
  /** Stable registry identifier — all tools are defined in code. */
  id: string;
  name: string;
  description: string;
  /** Fixed input JSON Schema for the runtime AI agent. */
  inputShape: DataShape;
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

export function getToolInputSchema(
  toolId: string,
): Record<string, unknown> {
  const definition = getToolDefinition(toolId);
  if (!definition) {
    return { type: "object", properties: {} };
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
