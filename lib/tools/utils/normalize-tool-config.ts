import { getToolHandlerDefinition } from "../tool-handler-registry";

export function normalizeToolConfig(
  handlerType: string,
  config: Record<string, string>,
): Record<string, string> {
  const definition = getToolHandlerDefinition(handlerType);
  if (!definition) {
    return {};
  }

  const normalized: Record<string, string> = {};

  for (const field of definition.configShape) {
    const value = config[field.key]?.trim() ?? "";
    if (field.required && !value) {
      throw new Error(`${field.label} is required.`);
    }
    if (value) {
      normalized[field.key] = value;
    }
  }

  return normalized;
}
