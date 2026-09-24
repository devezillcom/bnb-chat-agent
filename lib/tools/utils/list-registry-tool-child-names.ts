import { WEB_SEARCH_TOOL_NAMES } from "../web-research/constants";
import { resolveMcpSelectedTools } from "../mcp/utils/parse-mcp-selected-tools";

export function listRegistryToolChildNames(
  registryToolId: string,
  config: Record<string, unknown>,
): string[] {
  if (registryToolId === "web_research") {
    return [...WEB_SEARCH_TOOL_NAMES];
  }

  if (registryToolId === "mcp") {
    return resolveMcpSelectedTools(config).map((tool) => tool.name);
  }

  return [];
}
