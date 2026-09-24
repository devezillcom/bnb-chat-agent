import "server-only";

import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";
import { z } from "zod";

import { buildPrefixedToolName } from "@/lib/common/build-prefixed-tool-name";

import type { BuildChatAgentToolsForWorkspaceParams } from "../registry-types";
import { executeMcpTool } from "./execute-tool";
import { resolveMcpSelectedTools } from "./utils/parse-mcp-selected-tools";
import { toMcpToolZodSchema } from "./utils/to-mcp-tool-input-schema";

function buildMcpToolDescription(
  workspaceTool: BuildChatAgentToolsForWorkspaceParams["workspaceTool"],
  mcpTool: { description: string },
): string {
  const description =
    mcpTool.description.trim() || workspaceTool.description.trim();

  return [description, `MCP server: ${workspaceTool.name}.`]
    .filter(Boolean)
    .join(" ");
}

function buildUnavailableMcpTool(
  workspaceTool: BuildChatAgentToolsForWorkspaceParams["workspaceTool"],
  message: string,
): StructuredToolInterface {
  return tool(
    async () =>
      JSON.stringify({
        error: message,
      }),
    {
      name: workspaceTool.slug,
      description: [
        `MCP server "${workspaceTool.name}" is unavailable.`,
        "Do not invent tool names for this server.",
        message,
      ].join(" "),
      schema: z.object({}),
    },
  );
}

export async function buildMcpChatAgentTools(
  params: BuildChatAgentToolsForWorkspaceParams,
): Promise<StructuredToolInterface[]> {
  const { workspaceTool } = params;
  const selectedTools = resolveMcpSelectedTools(workspaceTool.config);

  if (selectedTools.length === 0) {
    return [
      buildUnavailableMcpTool(
        workspaceTool,
        "No MCP tools are selected for this connection.",
      ),
    ];
  }

  return selectedTools.map((mcpTool) =>
    tool(
      async (input) => {
        try {
          return await executeMcpTool(workspaceTool, {
            toolName: mcpTool.name,
            arguments: (input ?? {}) as Record<string, unknown>,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "MCP tool execution failed.";

          return JSON.stringify({ error: message });
        }
      },
      {
        name: buildPrefixedToolName(workspaceTool.slug, mcpTool.name),
        description: buildMcpToolDescription(workspaceTool, mcpTool),
        schema: toMcpToolZodSchema(mcpTool.inputSchema),
      },
    ),
  );
}
