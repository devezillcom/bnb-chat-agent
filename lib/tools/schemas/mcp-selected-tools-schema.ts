import { z } from "zod";

import type { McpToolInputJsonSchema } from "../utils/to-mcp-tool-input-schema";

export const mcpAvailableToolSchema = z.object({
  name: z.string().trim().min(1, { error: "Tool name is required." }),
  description: z.string(),
  inputSchema: z.looseObject({}),
});

export const mcpAvailableToolsSchema = z.array(mcpAvailableToolSchema);

export const mcpSelectedToolNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Tool name is required." });

export const mcpSelectedToolNamesSchema = z
  .array(mcpSelectedToolNameSchema)
  .min(1, { error: "Select at least one MCP tool." });

export type McpAvailableTool = z.infer<typeof mcpAvailableToolSchema> & {
  inputSchema: McpToolInputJsonSchema;
};

/** @deprecated Use McpAvailableTool */
export type McpSelectedTool = McpAvailableTool;
