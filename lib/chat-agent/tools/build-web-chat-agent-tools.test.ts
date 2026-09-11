import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeWebSearchTool, executeWebGetContentTool } = vi.hoisted(() => ({
  executeWebSearchTool: vi.fn(),
  executeWebGetContentTool: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/tools/executors/execute-web-search-tool", () => ({
  executeWebSearchTool,
}));
vi.mock("@/lib/tools/executors/execute-web-get-content-tool", () => ({
  executeWebGetContentTool,
}));

import {
  WEB_GET_CONTENT_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
} from "../constants/web-tools";
import { buildWebChatAgentTools } from "./build-web-chat-agent-tools";

const workspaceTool = {
  slug: "company_web",
  name: "Company web",
  description: "Search the public web",
  registryToolId: "web_research" as const,
  config: {
    exclude_domains: "example.com",
  },
};

describe("buildWebChatAgentTools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers web_search and web_get_content for a web_research workspace tool", () => {
    const usedNames = new Set<string>();

    const tools = buildWebChatAgentTools({
      workspaceTool,
      usedNames,
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      WEB_SEARCH_TOOL_NAME,
      WEB_GET_CONTENT_TOOL_NAME,
    ]);
  });

  it("delegates web_search execution to the executor with workspace config", async () => {
    executeWebSearchTool.mockResolvedValue("search result");

    const [webSearchTool] = buildWebChatAgentTools({
      workspaceTool,
      usedNames: new Set<string>(),
    });
    const result = await webSearchTool.invoke({ query: "latest news" });

    expect(executeWebSearchTool).toHaveBeenCalledWith(workspaceTool, {
      query: "latest news",
    });
    expect(result).toBe("search result");
  });

  it("delegates web_get_content execution to the executor", async () => {
    executeWebGetContentTool.mockResolvedValue("page content");

    const tools = buildWebChatAgentTools({
      workspaceTool,
      usedNames: new Set<string>(),
    });
    const webGetContentTool = tools[1];
    const result = await webGetContentTool.invoke({
      url: "https://example.com/article",
    });

    expect(executeWebGetContentTool).toHaveBeenCalledWith(workspaceTool, {
      url: "https://example.com/article",
    });
    expect(result).toBe("page content");
  });
});
