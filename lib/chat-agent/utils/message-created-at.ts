export function readMessageCreatedAt(
  additionalKwargs: { createdAt?: unknown } | undefined,
): string | undefined {
  const createdAt = additionalKwargs?.createdAt;

  if (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt))) {
    return undefined;
  }

  return createdAt;
}

export function withMessageCreatedAt(
  additionalKwargs: Record<string, unknown> | undefined,
  createdAt: string,
): Record<string, unknown> {
  return {
    ...additionalKwargs,
    createdAt,
  };
}
