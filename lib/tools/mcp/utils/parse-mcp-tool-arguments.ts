export function parseMcpToolArguments(
  rawArguments?: unknown,
): Record<string, unknown> {
  if (rawArguments == null) {
    return {};
  }

  if (typeof rawArguments === "object" && !Array.isArray(rawArguments)) {
    return rawArguments as Record<string, unknown>;
  }

  if (typeof rawArguments !== "string" || !rawArguments.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawArguments) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return { value: parsed };
  } catch {
    return { raw: rawArguments.trim() };
  }
}
