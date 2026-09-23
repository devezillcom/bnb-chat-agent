import type { CreateToolFormValues } from "../schema";
import {
  getToolDefinition,
  isKnownToolRegistryId,
} from "../tool-registry";

export function createToolFormDefaults(
  registryToolId: string,
): CreateToolFormValues {
  const registryTool =
    registryToolId && isKnownToolRegistryId(registryToolId)
      ? getToolDefinition(registryToolId)
      : undefined;

  return {
    name: registryTool?.name ?? "",
    slug: "",
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
  slug: string;
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
    slug: tool.slug,
    registryToolId: tool.registryToolId,
    description: tool.description ?? "",
    config: {
      ...fieldDefaults,
      ...tool.config,
    },
  };
}

export function suggestToolSlug(
  registryToolId: string,
  usedSlugs: ReadonlySet<string>,
): string {
  const base = registryToolId.replace(/[^a-z0-9_]/g, "_");
  let candidate = base;
  let index = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }

  return candidate;
}
