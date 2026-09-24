import {
  mcpAvailableToolSchema,
  mcpSelectedToolNameSchema,
  mcpSelectedToolNamesSchema,
  type McpAvailableTool,
} from "../schemas/selected-tools-schema";

function parseMcpAvailableToolsArray(value: unknown): McpAvailableTool[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const result = mcpAvailableToolSchema.safeParse(item);
    return result.success ? [result.data as McpAvailableTool] : [];
  });
}

function parseMcpSelectedToolNamesArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const result = mcpSelectedToolNameSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}

export function parseMcpAvailableTools(value: unknown): McpAvailableTool[] {
  return parseMcpAvailableToolsArray(value);
}

export function parseMcpSelectedToolNames(value: unknown): string[] {
  return parseMcpSelectedToolNamesArray(value);
}

export function resolveMcpDisplayTools(config: {
  available_tools?: unknown;
}): McpAvailableTool[] {
  return parseMcpAvailableTools(config.available_tools);
}

export function resolveMcpSelectedTools(config: {
  available_tools?: unknown;
  selected_tools?: unknown;
}): McpAvailableTool[] {
  const availableByName = new Map(
    parseMcpAvailableTools(config.available_tools).map((tool) => [
      tool.name,
      tool,
    ]),
  );

  return parseMcpSelectedToolNames(config.selected_tools).flatMap((name) => {
    const tool = availableByName.get(name);
    return tool ? [tool] : [];
  });
}

export function parseMcpSelectedToolNamesForSave(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Select at least one MCP tool.");
  }

  const result = mcpSelectedToolNamesSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Select at least one MCP tool.",
    );
  }

  return result.data;
}

export function assertMcpSelectedToolsAvailable(params: {
  available_tools: unknown;
  selected_tools: unknown;
}): void {
  const availableNames = new Set(
    parseMcpAvailableTools(params.available_tools).map((tool) => tool.name),
  );

  for (const name of parseMcpSelectedToolNames(params.selected_tools)) {
    if (!availableNames.has(name)) {
      throw new Error(`Selected tool "${name}" is not in available tools.`);
    }
  }
}
