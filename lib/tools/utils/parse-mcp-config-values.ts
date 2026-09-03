export function parseMcpArgs(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      throw new Error("Args must be a JSON array of strings.");
    }

    if (
      !Array.isArray(parsed) ||
      parsed.some((item) => typeof item !== "string")
    ) {
      throw new Error("Args must be a JSON array of strings.");
    }

    return parsed.map((item) => item.trim()).filter((item) => item.length > 0);
  }

  return trimmed.split(/\s+/).filter((item) => item.length > 0);
}

export function parseMcpStringRecord(
  raw: string,
  label: string,
): Record<string, string> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch {
      throw new Error(`${label} must be a JSON object of string values.`);
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.values(parsed).some((value) => typeof value !== "string")
    ) {
      throw new Error(`${label} must be a JSON object of string values.`);
    }

    return Object.fromEntries(
      Object.entries(parsed as Record<string, string>).map(([key, value]) => [
        key.trim(),
        value.trim(),
      ]),
    );
  }

  const result: Record<string, string> = {};

  for (const line of trimmed.split(/\r?\n/)) {
    const entry = line.trim();
    if (!entry || entry.startsWith("#")) {
      continue;
    }

    const separatorIndex = entry.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(
        `${label} must use KEY=value lines or a JSON object of string values.`,
      );
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();
    if (!key) {
      throw new Error(
        `${label} must use KEY=value lines or a JSON object of string values.`,
      );
    }

    result[key] = value;
  }

  return result;
}
