import "server-only";

import type { WorkspaceToolRuntime } from "../types";

type McpToolInput = {
  tool_name: string;
  arguments?: string;
};

function parseMcpArguments(rawArguments?: string): Record<string, unknown> {
  if (!rawArguments?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawArguments) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return { value: parsed };
  } catch {
    return { raw: rawArguments.trim() };
  }
}

export async function executeMcpTool(
  tool: WorkspaceToolRuntime,
  input: McpToolInput,
): Promise<string> {
  const serverUrl = tool.config.server_url?.trim();

  if (!serverUrl) {
    return JSON.stringify({
      error: "MCP tool is missing server_url configuration.",
    });
  }

  const response = await fetch(serverUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: input.tool_name.trim(),
        arguments: parseMcpArguments(input.arguments),
      },
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    return JSON.stringify({
      error: `MCP request failed with status ${response.status}.`,
      body,
    });
  }

  try {
    return JSON.stringify(JSON.parse(body));
  } catch {
    return JSON.stringify({ result: body });
  }
}
