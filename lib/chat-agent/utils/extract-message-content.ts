function extractContentPartText(part: unknown): string {
  if (typeof part === "string") return part;

  if (
    part &&
    typeof part === "object" &&
    "type" in part &&
    part.type === "text" &&
    "text" in part &&
    typeof part.text === "string"
  ) {
    return part.text;
  }

  return "";
}

export function extractMessageContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map(extractContentPartText).join("");
  }

  return "";
}
