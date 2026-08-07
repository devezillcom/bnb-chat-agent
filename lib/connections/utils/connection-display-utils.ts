export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export function getConnectionScheduleId(connectionId: string) {
  return `connection.refresh.${connectionId}`;
}

export function getExternalId(
  metadata: Record<string, unknown> | null | undefined,
) {
  const externalId = metadata?.external_id;
  return typeof externalId === "string" && externalId.trim()
    ? externalId.trim()
    : null;
}

export function getConnectionMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getConnectionTypeLabel(channelType: string) {
  switch (channelType) {
    case "facebook":
      return "Facebook";
    default:
      return channelType;
  }
}

export function getConnectionAvatarUrl(
  metadata: Record<string, unknown> | null | undefined,
) {
  return getConnectionMetadataString(metadata, "avatar_url");
}
