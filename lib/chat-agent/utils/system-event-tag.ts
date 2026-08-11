const SYSTEM_EVENT_TAG = "system-event";
const SYSTEM_EVENT_TAG_PATTERN = new RegExp(
  `<${SYSTEM_EVENT_TAG}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${SYSTEM_EVENT_TAG}>`,
  "g",
);

export function wrapSystemEvent(type: string, body: string): string {
  return `<${SYSTEM_EVENT_TAG} type="${type}">\n${body.trim()}\n</${SYSTEM_EVENT_TAG}>`;
}

export function stripSystemEventTags(text: string): string {
  return text.replace(SYSTEM_EVENT_TAG_PATTERN, "").trim();
}

export function buildBienhinhImageCompletedEventMessage(params: {
  templateName: string;
  imageUrl: string;
}): string {
  return wrapSystemEvent(
    "bienhinh_image_completed",
    [
      "Background image generation completed.",
      `Template: ${params.templateName}`,
      `Image URL: ${params.imageUrl}`,
      "Inform the user that their image is ready.",
    ].join("\n"),
  );
}

export function buildBienhinhImageFailedEventMessage(params: {
  error: string;
}): string {
  return wrapSystemEvent(
    "bienhinh_image_failed",
    [
      "Background image generation failed.",
      `Error: ${params.error}`,
      "Inform the user that image generation failed.",
    ].join("\n"),
  );
}
