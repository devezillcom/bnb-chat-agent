import { TOOL_REGISTRY_METADATA } from "../tool-registry-metadata";
import type { ListToolRegistryResult } from "../types";

export async function listToolRegistry(): Promise<ListToolRegistryResult> {
  return {
    items: TOOL_REGISTRY_METADATA.map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      configFields: entry.configFields,
    })),
  };
}
