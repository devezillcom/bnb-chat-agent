import "server-only";

import type { WorkspaceToolRuntime } from "../types";

type HttpApiToolInput = {
  method: string;
  path: string;
  body?: string;
};

function joinBaseUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase).toString();
}

export async function executeHttpApiTool(
  tool: WorkspaceToolRuntime,
  input: HttpApiToolInput,
): Promise<string> {
  const baseUrl = tool.config.base_url?.trim();
  const apiKey = tool.config.api_key?.trim();

  if (!baseUrl || !apiKey) {
    return JSON.stringify({
      error: "HTTP API tool is missing base_url or api_key configuration.",
    });
  }

  const method = input.method.trim().toUpperCase();
  const url = joinBaseUrl(baseUrl, input.path.trim());
  const hasBody = input.body?.trim() && !["GET", "HEAD"].includes(method);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json, text/plain, */*",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? input.body!.trim() : undefined,
  });

  const body = await response.text();

  return JSON.stringify({
    status: response.status,
    body,
  });
}
