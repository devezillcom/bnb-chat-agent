import "server-only";

import { exaGetContents } from "@/lib/exa/services/exa-get-contents";
import { formatExaImageLines } from "@/lib/exa/utils/format-exa-image-lines";

import type { WorkspaceToolRuntime } from "@/lib/tools/types";

type WebGetContentToolInput = {
  url: string;
};

export async function executeWebGetContentTool(
  tool: WorkspaceToolRuntime,
  input: WebGetContentToolInput,
): Promise<string> {
  try {
    new URL(input.url);
  } catch {
    return "URL must be a valid absolute URL.";
  }

  const { item, error } = await exaGetContents({
    url: input.url,
  });

  if (!item) {
    return error ?? "Could not fetch content for this URL.";
  }

  const title = item.title?.trim() || item.url;
  const lines = [`Title: ${title}`, `URL: ${item.url}`];

  if (item.author) {
    lines.push(`Author: ${item.author}`);
  }

  if (item.publishedDate) {
    lines.push(`Published: ${item.publishedDate}`);
  }

  lines.push(...formatExaImageLines(item));
  lines.push(`Content:\n${item.text}`);

  return lines.join("\n");
}
