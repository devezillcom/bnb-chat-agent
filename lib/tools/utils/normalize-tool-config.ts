import { getToolDefinition } from "../tool-registry";

export function normalizeToolConfig(
  registryToolId: string,
  config: Record<string, string>,
): Record<string, string> {
  const definition = getToolDefinition(registryToolId);
  if (!definition) {
    return {};
  }

  const trimmed = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.trim()]),
  );

  const result = definition.configSchema.safeParse(trimmed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Invalid tool configuration.");
  }

  return result.data;
}
