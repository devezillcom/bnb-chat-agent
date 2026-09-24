export function parseExcludeDomains(raw: string): string[] {
  const domains = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) {
      continue;
    }

    const normalized = trimmed
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");

    if (normalized) {
      domains.add(normalized);
    }
  }

  return [...domains];
}
