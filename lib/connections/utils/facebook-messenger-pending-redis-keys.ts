export function getFacebookMessengerPendingMessagesKey(
  connectionId: string,
  psid: string,
): string {
  return `facebook-pending:msgs:${connectionId}:${psid}`;
}

export function getFacebookMessengerPendingMidsKey(
  connectionId: string,
  psid: string,
): string {
  return `facebook-pending:mids:${connectionId}:${psid}`;
}

export function getFacebookMessengerPendingMetaKey(
  connectionId: string,
  psid: string,
): string {
  return `facebook-pending:meta:${connectionId}:${psid}`;
}
