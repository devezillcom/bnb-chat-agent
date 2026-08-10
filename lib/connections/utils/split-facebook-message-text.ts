import { FACEBOOK_MESSENGER_MAX_TEXT_LENGTH } from "../constants";

export function splitFacebookMessageText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.length <= FACEBOOK_MESSENGER_MAX_TEXT_LENGTH) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > FACEBOOK_MESSENGER_MAX_TEXT_LENGTH) {
    let splitAt = remaining.lastIndexOf("\n", FACEBOOK_MESSENGER_MAX_TEXT_LENGTH);
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", FACEBOOK_MESSENGER_MAX_TEXT_LENGTH);
    }
    if (splitAt <= 0) {
      splitAt = FACEBOOK_MESSENGER_MAX_TEXT_LENGTH;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}
