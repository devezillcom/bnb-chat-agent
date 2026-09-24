import type { CreateToolFormValues } from "../schema";
import {
  getToolDefinition,
  isKnownToolRegistryId,
} from "../tool-registry-metadata";

export function createToolFormDefaults(
  registryToolId: string,
): CreateToolFormValues {
  const registryTool =
    registryToolId && isKnownToolRegistryId(registryToolId)
      ? getToolDefinition(registryToolId)
      : undefined;

  return {
    name: registryTool?.name ?? "",
    registryToolId: registryTool?.id ?? "",
    description: registryTool?.description ?? "",
    config: Object.fromEntries(
      (registryTool?.configFields ?? []).map((field) => [
        field.key,
        field.defaultValue ?? "",
      ]),
    ),
  };
}

export function agentToolItemToFormValues(tool: {
  name: string;
  registryToolId: string;
  description: string | null;
  config: Record<string, unknown>;
}): CreateToolFormValues {
  const registryTool = getToolDefinition(tool.registryToolId);
  const fieldDefaults = Object.fromEntries(
    (registryTool?.configFields ?? []).map((field) => [
      field.key,
      tool.config?.[field.key] ?? field.defaultValue ?? "",
    ]),
  );

  return {
    name: tool.name,
    registryToolId: tool.registryToolId,
    description: tool.description ?? "",
    config: {
      ...fieldDefaults,
      ...tool.config,
    },
  };
}
