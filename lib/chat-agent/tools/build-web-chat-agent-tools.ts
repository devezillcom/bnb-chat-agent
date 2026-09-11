import "server-only";

import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";
import { z } from "zod";

import { executeWebGetContentTool } from "@/lib/tools/executors/execute-web-get-content-tool";
import { executeWebSearchTool } from "@/lib/tools/executors/execute-web-search-tool";
import type { WorkspaceToolRuntime } from "@/lib/tools/types";
import { allocateLangChainToolName } from "@/lib/tools/utils/to-mcp-langchain-tool-name";

import {
  WEB_GET_CONTENT_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
} from "../constants/web-tools";

export type BuildWebChatAgentToolsParams = {
  workspaceTool: WorkspaceToolRuntime;
  usedNames: Set<string>;
};

const webSearchToolInputSchema = z.object({
  query: z.string().trim().min(1, { error: "Query is required." }),
});

const webGetContentToolInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, { error: "URL is required." })
    .describe(
      "The page URL to fetch (absolute URL, e.g. https://example.com/page).",
    ),
});

function buildWebSearchDescription(workspaceTool: WorkspaceToolRuntime): string {
  return [
    "Search the public web for current information. Returns excerpts with titles and URLs.",
    `Web search tool: ${workspaceTool.name}.`,
  ].join(" ");
}

function buildWebGetContentDescription(
  workspaceTool: WorkspaceToolRuntime,
): string {
  return [
    "Fetch the full page content for a specific URL. Use after web_search when you need more detail from a promising result.",
    `Web search tool: ${workspaceTool.name}.`,
  ].join(" ");
}

export function buildWebChatAgentTools(
  params: BuildWebChatAgentToolsParams,
): StructuredToolInterface[] {
  const { workspaceTool, usedNames } = params;
  const webSearchName = allocateLangChainToolName(
    WEB_SEARCH_TOOL_NAME,
    usedNames,
    workspaceTool.slug,
  );
  const webGetContentName = allocateLangChainToolName(
    WEB_GET_CONTENT_TOOL_NAME,
    usedNames,
    workspaceTool.slug,
  );

  return [
    tool(
      async (input) => {
        try {
          return await executeWebSearchTool(workspaceTool, input);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Web search failed.";

          return JSON.stringify({ error: message });
        }
      },
      {
        name: webSearchName,
        description: buildWebSearchDescription(workspaceTool),
        schema: webSearchToolInputSchema,
      },
    ),
    tool(
      async (input) => {
        try {
          return await executeWebGetContentTool(workspaceTool, input);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Web content fetch failed.";

          return JSON.stringify({ error: message });
        }
      },
      {
        name: webGetContentName,
        description: buildWebGetContentDescription(workspaceTool),
        schema: webGetContentToolInputSchema,
      },
    ),
  ];
}
