import { getToolDefinition } from "../tool-registry-metadata";

export function normalizeToolConfig(
  registryToolId: string,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const definition = getToolDefinition(registryToolId);
  if (!definition) {
    return {};
  }

  const trimmed = Object.fromEntries(
    Object.entries(config).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.trim()];
      }

      return [key, value];
    }),
  );

  const result = definition.configSchema.safeParse(trimmed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Invalid tool configuration.");
  }

  return result.data;
}
