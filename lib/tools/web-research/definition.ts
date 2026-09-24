import type { ToolDefinition } from "../registry-types";
import { webResearchConfigSchema } from "./config-schema";

export const webResearchTool: ToolDefinition = {
  id: "web_research",
  name: "Web search",
  description:
    "Search the public web and fetch page content via Exa. Exposes web_search and web_get_content to the agent.",
  configSchema: webResearchConfigSchema,
  configFields: [
    {
      key: "exclude_domains",
      label: "Exclude domains",
      description:
        "Optional domains to exclude from search results. One domain per line.",
      type: "textarea",
      placeholder: "example.com\nfacebook.com",
    },
  ],
  inputShape: { fields: [] },
};
