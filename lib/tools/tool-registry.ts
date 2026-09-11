import { z } from "zod";

import { mcpConfigSchema } from "./schemas/mcp-config-schema";
import { webResearchConfigSchema } from "./schemas/web-research-config-schema";
import {
  bienhinhCreateImageInputJsonSchema,
  bienhinhCreateImageInputSchema,
} from "./schemas/bienhinh-create-image-input-schema";
import type { DataShape } from "./utils/data-shape";
import { dataShapeToJsonSchema } from "./utils/data-shape";
import { dataShapeToZodSchema } from "./utils/data-shape-to-zod-schema";

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
    description:
      "Connect to a Model Context Protocol server over HTTP, SSE, or a local command. Tools advertised by the server are discovered when the agent runs.",
    configSchema: mcpConfigSchema,
    configFields: [
      {
        key: "transport",
        label: "Transport",
        description: "How this workspace connects to the MCP server.",
        required: true,
        defaultValue: "http",
        type: "radio",
        options: [
          {
            value: "http",
            label: "HTTP",
            description: "Remote Streamable HTTP server. Common for hosted MCP APIs.",
          },
          {
            value: "sse",
            label: "SSE",
            description: "Remote Server-Sent Events server. Use for older MCP endpoints.",
          },
          {
            value: "stdio",
            label: "stdio",
            description: "Local process started with a command, args, and env.",
          },
        ],
      },
      {
        key: "server_url",
        label: "Server URL",
        description: "MCP endpoint URL, e.g. https://example.com/mcp.",
        required: true,
        placeholder: "https://mcp.example.com/mcp",
        showWhen: {
          key: "transport",
          values: ["http", "sse"],
        },
      },
      {
        key: "auth_type",
        label: "Auth",
        description: "Authentication sent with HTTP and SSE requests.",
        required: true,
        defaultValue: "none",
        type: "radio",
        options: [
          {
            value: "none",
            label: "None",
            description: "No Authorization header.",
          },
          {
            value: "bearer",
            label: "Bearer token",
            description: "Send Authorization: Bearer <token>.",
          },
        ],
        showWhen: {
          key: "transport",
          values: ["http", "sse"],
        },
      },
      {
        key: "bearer_token",
        label: "Bearer token",
        description: "Access token sent as Authorization: Bearer <token>.",
        secret: true,
        placeholder: "mcp_...",
        showWhen: [
          {
            key: "transport",
            values: ["http", "sse"],
          },
          {
            key: "auth_type",
            values: ["bearer"],
          },
        ],
      },
      {
        key: "headers",
        label: "Headers",
        description:
          "Optional extra HTTP headers. JSON object or KEY=value lines.",
        type: "textarea",
        placeholder: "X-API-Key=your-key",
        showWhen: {
          key: "transport",
          values: ["http", "sse"],
        },
      },
      {
        key: "command",
        label: "Command",
        description: "Executable used to start the local MCP server.",
        required: true,
        placeholder: "npx",
        showWhen: {
          key: "transport",
          values: ["stdio"],
        },
      },
      {
        key: "args",
        label: "Args",
        description:
          "Command arguments as a JSON array of strings or space-separated values.",
        type: "textarea",
        placeholder: '["-y", "@modelcontextprotocol/server-github"]',
        showWhen: {
          key: "transport",
          values: ["stdio"],
        },
      },
      {
        key: "env",
        label: "Environment",
        description:
          "Optional env vars for the local process. JSON object or KEY=value lines. Use this for API tokens on stdio servers.",
        type: "textarea",
        placeholder: "GITHUB_PERSONAL_ACCESS_TOKEN=your-token",
        showWhen: {
          key: "transport",
          values: ["stdio"],
        },
      },
      {
        key: "cwd",
        label: "Working directory",
        description: "Optional working directory for the local MCP process.",
        placeholder: "/path/to/project",
        showWhen: {
          key: "transport",
          values: ["stdio"],
        },
      },
    ],
    inputShape: { fields: [] },
  },
  {
    id: "web_research",
    name: "Web search",
    description:
      "Search the public web and fetch page content via Exa. Exposes web_search and web_get_content to the agent.",
    configSchema: webResearchConfigSchema,
    configFields: [
      {
        key: "exclude_domains",
        label: "Exclude domains",
        description:
          "Optional domains to exclude from search results. One domain per line.",
        type: "textarea",
        placeholder: "example.com\nfacebook.com",
      },
    ],
    inputShape: { fields: [] },
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
