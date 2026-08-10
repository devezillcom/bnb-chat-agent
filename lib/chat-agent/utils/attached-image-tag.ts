const ATTACHED_IMAGE_TAG = "attached-image";
const ATTACHED_IMAGE_TAG_PATTERN = new RegExp(
  `<${ATTACHED_IMAGE_TAG}>[\\s\\S]*?<\\/${ATTACHED_IMAGE_TAG}>`,
  "g",
);

export function wrapAttachedImage(url: string): string {
  return `<${ATTACHED_IMAGE_TAG}>${url}</${ATTACHED_IMAGE_TAG}>`;
}

export function stripAttachedImageTags(text: string): string {
  return text.replace(ATTACHED_IMAGE_TAG_PATTERN, "");
}
