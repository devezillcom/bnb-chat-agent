import "server-only";

import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

import type { McpRuntimeConfig } from "./to-mcp-runtime-config";

export function createMcpClientTransport(
  config: McpRuntimeConfig,
): Transport {
  if (config.transport === "stdio") {
    return new StdioClientTransport({
      command: config.command,
      args: config.args,
      cwd: config.cwd,
      env: {
        ...getDefaultEnvironment(),
        ...config.env,
      },
      stderr: "pipe",
    });
  }

  const url = new URL(config.serverUrl);
  const requestInit = {
    headers: config.headers,
  };

  if (config.transport === "sse") {
    return new SSEClientTransport(url, { requestInit });
  }

  return new StreamableHTTPClientTransport(url, { requestInit });
}
