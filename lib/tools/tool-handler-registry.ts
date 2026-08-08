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

export type ToolHandlerDefinition = {
  handlerType: string;
  name: string;
  description: string;
  configShape: ToolConfigFieldDefinition[];
  inputShape: DataShape;
  outputShape?: DataShape;
};

export const TOOL_HANDLER_REGISTRY: ToolHandlerDefinition[] = [
  {
    handlerType: "http_api",
    name: "HTTP API",
    description: "Call an external HTTP API using a base URL and credentials.",
    configShape: [
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
    handlerType: "mcp",
    name: "MCP",
    description: "Connect to a Model Context Protocol server.",
    configShape: [
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
    handlerType: "builtin",
    name: "Built-in",
    description: "Platform-provided tool with no extra configuration.",
    configShape: [],
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

export const TOOL_HANDLER_TYPES = TOOL_HANDLER_REGISTRY.map(
  (entry) => entry.handlerType,
);

export type ToolHandlerType = (typeof TOOL_HANDLER_TYPES)[number];

export function getToolHandlerDefinition(
  handlerType: string,
): ToolHandlerDefinition | undefined {
  return TOOL_HANDLER_REGISTRY.find((entry) => entry.handlerType === handlerType);
}

export function isKnownToolHandlerType(
  handlerType: string,
): handlerType is ToolHandlerType {
  return TOOL_HANDLER_REGISTRY.some((entry) => entry.handlerType === handlerType);
}

export function getHandlerInputSchema(
  handlerType: string,
): Record<string, unknown> {
  const definition = getToolHandlerDefinition(handlerType);
  if (!definition) {
    return { type: "object", properties: {} };
  }

  return dataShapeToJsonSchema(definition.inputShape);
}

export function getHandlerOutputSchema(
  handlerType: string,
): Record<string, unknown> | null {
  const definition = getToolHandlerDefinition(handlerType);
  if (!definition?.outputShape?.fields.length) {
    return null;
  }

  return dataShapeToJsonSchema(definition.outputShape);
}
