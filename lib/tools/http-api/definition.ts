import { z } from "zod";

import type { ToolDefinition } from "../registry-types";

export const httpApiTool: ToolDefinition = {
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
};
