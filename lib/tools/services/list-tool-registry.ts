import { TOOL_REGISTRY } from "../tool-registry";
import type { ListToolRegistryResult } from "../types";

export async function listToolRegistry(): Promise<ListToolRegistryResult> {
  return {
    items: TOOL_REGISTRY.map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      configFields: entry.configFields,
    })),
  };
}
