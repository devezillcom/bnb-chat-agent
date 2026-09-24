import "server-only";

import { exaSearch } from "@/lib/exa/services/exa-search";
import { formatExaImageLines } from "@/lib/exa/utils/format-exa-image-lines";

import type { WorkspaceToolRuntime } from "@/lib/tools/types";
import { getConfigString } from "@/lib/tools/utils/get-config-string";

import { parseExcludeDomains } from "./parse-exclude-domains";

type WebSearchToolInput = {
  query: string;
};

export async function executeWebSearchTool(
  tool: WorkspaceToolRuntime,
  input: WebSearchToolInput,
): Promise<string> {
  const excludeDomains = parseExcludeDomains(
    getConfigString(tool.config, "exclude_domains"),
  );
  const { results } = await exaSearch({
    query: input.query,
    numResults: 5,
    excludeDomains,
  });

  if (results.length === 0) {
    return "No web results found for this query.";
  }

  const formattedResults = results.map((result, index) => {
    const url = result.url?.trim();
    const title = result.title?.trim() || url || `Web result ${index + 1}`;
    const snippet = result.text?.trim() || "(no excerpt available)";

    return [
      `Result ${index + 1}`,
      `Title: ${title}`,
      url ? `URL: ${url}` : "URL: unavailable",
      ...formatExaImageLines({
        image: result.image,
        favicon: result.favicon,
        imageLinks: result.extras?.imageLinks,
      }),
      `Excerpt: ${snippet}`,
    ].join("\n");
  });

  return formattedResults.join("\n\n");
}
