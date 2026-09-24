import type { ToolDefinition } from "../registry-types";
import { mcpConfigSchema } from "./schemas/config-schema";

export const mcpTool: ToolDefinition = {
  id: "mcp",
  name: "MCP",
  description:
    "Connect to a Model Context Protocol server over HTTP, SSE, or a local command. Choose which MCP tools the agent can call.",
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
};
