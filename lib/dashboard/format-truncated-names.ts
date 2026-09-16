type FormatTruncatedNamesOptions = {
  maxItems?: number;
  separator?: string;
};

export function formatTruncatedNames(
  names: string[],
  options?: FormatTruncatedNamesOptions,
): string {
  if (names.length === 0) {
    return "";
  }

  const separator = options?.separator ?? ", ";
  const maxItems = options?.maxItems ?? 4;
  const trimmedNames = names.map((name) => name.trim()).filter(Boolean);

  if (trimmedNames.length === 0) {
    return "";
  }

  if (trimmedNames.length <= maxItems) {
    return trimmedNames.join(separator);
  }

  const visible = trimmedNames.slice(0, maxItems);
  const remaining = trimmedNames.length - maxItems;

  return `${visible.join(separator)} +${remaining}`;
}
