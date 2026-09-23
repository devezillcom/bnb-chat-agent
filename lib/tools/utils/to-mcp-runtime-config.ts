import type {
  McpAuthType,
  McpConnectionConfig,
  McpTransport,
} from "../schemas/mcp-config-schema";
import { parseMcpArgs, parseMcpStringRecord } from "./parse-mcp-config-values";

export type McpHttpRuntimeConfig = {
  transport: Exclude<McpTransport, "stdio">;
  serverUrl: string;
  authType: McpAuthType;
  bearerToken?: string;
  headers: Record<string, string>;
};

export type McpStdioRuntimeConfig = {
  transport: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd?: string;
};

export type McpRuntimeConfig = McpHttpRuntimeConfig | McpStdioRuntimeConfig;

function buildHttpHeaders(
  config: McpConnectionConfig,
): Record<string, string> {
  const headers = parseMcpStringRecord(config.headers, "Headers");

  if (config.auth_type === "bearer" && config.bearer_token) {
    headers.Authorization = `Bearer ${config.bearer_token}`;
  }

  return headers;
}

export function toMcpRuntimeConfig(
  config: McpConnectionConfig,
): McpRuntimeConfig {
  if (config.transport === "stdio") {
    return {
      transport: "stdio",
      command: config.command,
      args: parseMcpArgs(config.args),
      env: parseMcpStringRecord(config.env, "Environment variables"),
      cwd: config.cwd || undefined,
    };
  }

  return {
    transport: config.transport,
    serverUrl: config.server_url,
    authType: config.auth_type,
    bearerToken: config.bearer_token || undefined,
    headers: buildHttpHeaders(config),
  };
}
