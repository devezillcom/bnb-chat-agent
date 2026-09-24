import "server-only";

import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";
import { z } from "zod";

import { buildPrefixedToolName } from "@/lib/common/build-prefixed-tool-name";

import type { BuildChatAgentToolsForWorkspaceParams } from "../registry-types";
import {
  WEB_GET_CONTENT_TOOL_NAME,
  WEB_SEARCH_TOOL_NAME,
} from "./constants";
import { executeWebGetContentTool } from "./execute-get-content-tool";
import { executeWebSearchTool } from "./execute-search-tool";

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

function buildWebSearchDescription(
  workspaceTool: BuildChatAgentToolsForWorkspaceParams["workspaceTool"],
): string {
  return [
    "Search the public web for current information. Returns excerpts with titles and URLs.",
    `Web search tool: ${workspaceTool.name}.`,
  ].join(" ");
}

function buildWebGetContentDescription(
  workspaceTool: BuildChatAgentToolsForWorkspaceParams["workspaceTool"],
): string {
  return [
    "Fetch the full page content for a specific URL. Use after web_search when you need more detail from a promising result.",
    `Web search tool: ${workspaceTool.name}.`,
  ].join(" ");
}

export function buildWebResearchChatAgentTools(
  params: BuildChatAgentToolsForWorkspaceParams,
): StructuredToolInterface[] {
  const { workspaceTool } = params;

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
        name: buildPrefixedToolName(
          workspaceTool.slug,
          WEB_SEARCH_TOOL_NAME,
        ),
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
        name: buildPrefixedToolName(
          workspaceTool.slug,
          WEB_GET_CONTENT_TOOL_NAME,
        ),
        description: buildWebGetContentDescription(workspaceTool),
        schema: webGetContentToolInputSchema,
      },
    ),
  ];
}
