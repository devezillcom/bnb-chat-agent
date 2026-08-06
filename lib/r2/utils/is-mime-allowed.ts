export function isMimeAllowed(
  contentType: string,
  allowed: ReadonlySet<string>,
): boolean {
  if (allowed.has("*")) return true;
  if (allowed.has(contentType)) return true;
  for (const rule of allowed) {
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -2).toLowerCase();
      if (contentType.startsWith(`${prefix}/`)) return true;
    }
  }
  return false;
}
