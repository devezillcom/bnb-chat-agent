export const LANGCHAIN_TOOL_NAME_MAX_LENGTH = 64;

export function sanitizeLangChainToolName(raw: string): string {
  const sanitized = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, LANGCHAIN_TOOL_NAME_MAX_LENGTH);

  return sanitized || "mcp_tool";
}

function withSuffix(base: string, suffix: string): string {
  const maxBaseLength = LANGCHAIN_TOOL_NAME_MAX_LENGTH - suffix.length;
  if (maxBaseLength <= 0) {
    return suffix.slice(0, LANGCHAIN_TOOL_NAME_MAX_LENGTH);
  }

  return `${base.slice(0, maxBaseLength)}${suffix}`;
}

export function allocateLangChainToolName(
  preferredName: string,
  usedNames: Set<string>,
  prefix?: string,
): string {
  const sanitized = sanitizeLangChainToolName(preferredName);
  if (!usedNames.has(sanitized)) {
    usedNames.add(sanitized);
    return sanitized;
  }

  if (prefix?.trim()) {
    const prefixed = sanitizeLangChainToolName(
      `${prefix.trim()}__${preferredName}`,
    );
    if (!usedNames.has(prefixed)) {
      usedNames.add(prefixed);
      return prefixed;
    }
  }

  const collisionBase = prefix?.trim()
    ? sanitizeLangChainToolName(`${prefix.trim()}__${preferredName}`)
    : sanitized;

  for (let index = 2; index < 1000; index += 1) {
    const candidate = withSuffix(collisionBase, `_${index}`);
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }

  throw new Error("Unable to allocate a unique LangChain tool name.");
}
