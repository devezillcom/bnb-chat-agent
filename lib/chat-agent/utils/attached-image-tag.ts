import type { ChatAgentImageAttachment } from "../schema";

const ATTACHED_IMAGE_TAG = "attached-image";
const ATTACHED_IMAGE_TAG_PATTERN = new RegExp(
  `<${ATTACHED_IMAGE_TAG}>([\\s\\S]*?)<\\/${ATTACHED_IMAGE_TAG}>`,
  "g",
);

export function wrapAttachedImage(url: string): string {
  return `<${ATTACHED_IMAGE_TAG}>${url}</${ATTACHED_IMAGE_TAG}>`;
}

export function stripAttachedImageTags(text: string): {
  content: string;
  images: ChatAgentImageAttachment[];
} {
  const images: ChatAgentImageAttachment[] = [];
  const content = text.replace(
    ATTACHED_IMAGE_TAG_PATTERN,
    (_match, url: string) => {
      const trimmedUrl = url.trim();
      if (trimmedUrl && URL.canParse(trimmedUrl)) {
        images.push({ url: trimmedUrl });
      }
      return "";
    },
  );

  return { content, images };
}
