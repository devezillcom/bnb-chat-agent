export function getConfigString(
  config: Record<string, unknown>,
  key: string,
): string {
  const value = config[key];
  return typeof value === "string" ? value.trim() : "";
}
