import type { ExaImageExtras } from "../types";

export function formatExaImageLines(extras: ExaImageExtras): string[] {
  const lines: string[] = [];

  if (extras.image?.trim()) {
    lines.push(`Image: ${extras.image.trim()}`);
  }

  if (extras.favicon?.trim()) {
    lines.push(`Favicon: ${extras.favicon.trim()}`);
  }

  const imageLinks = extras.imageLinks?.map((link) => link.trim()).filter(Boolean);
  if (imageLinks && imageLinks.length > 0) {
    lines.push(
      `Image links:\n${imageLinks.map((link, index) => `${index + 1}. ${link}`).join("\n")}`,
    );
  }

  return lines;
}
