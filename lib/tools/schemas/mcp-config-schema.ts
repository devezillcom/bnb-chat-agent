import { z } from "zod";

import {
  parseMcpArgs,
  parseMcpStringRecord,
} from "../utils/parse-mcp-config-values";
import {
  assertMcpSelectedToolsAvailable,
  parseMcpSelectedToolNamesForSave,
} from "../utils/parse-mcp-selected-tools";
import {
  mcpAvailableToolSchema,
  mcpSelectedToolNameSchema,
} from "./mcp-selected-tools-schema";

export const MCP_TRANSPORTS = ["http", "sse", "stdio"] as const;
export const MCP_AUTH_TYPES = ["none", "bearer"] as const;

export type McpTransport = (typeof MCP_TRANSPORTS)[number];
export type McpAuthType = (typeof MCP_AUTH_TYPES)[number];

const defaultedEnum = <T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
  error: string,
) =>
  z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? "";
      return trimmed.length > 0 ? trimmed : fallback;
    })
    .pipe(z.enum(values, { error }));

const optionalConfigString = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");

const mcpAvailableToolsArraySchema = z.array(mcpAvailableToolSchema);
const mcpSelectedToolNamesArraySchema = z.array(mcpSelectedToolNameSchema);

const mcpConnectionFields = {
  transport: defaultedEnum(
    MCP_TRANSPORTS,
    "http",
    "Choose a valid MCP transport.",
  ),
  server_url: optionalConfigString,
  auth_type: defaultedEnum(
    MCP_AUTH_TYPES,
    "none",
    "Choose a valid MCP auth type.",
  ),
  bearer_token: optionalConfigString,
  headers: optionalConfigString,
  command: optionalConfigString,
  args: optionalConfigString,
  env: optionalConfigString,
  cwd: optionalConfigString,
};

function refineMcpConnectionConfig(
  value: z.infer<typeof mcpConnectionConfigSchema>,
  ctx: z.RefinementCtx,
) {
  if (value.transport === "stdio") {
    if (!value.command) {
      ctx.addIssue({
        code: "custom",
        path: ["command"],
        message: "Command is required for stdio transport.",
      });
    }
  } else if (!value.server_url) {
    ctx.addIssue({
      code: "custom",
      path: ["server_url"],
      message: "Server URL is required for HTTP and SSE transports.",
    });
  } else {
    const urlResult = z
      .url({ error: "Server URL must be valid." })
      .safeParse(value.server_url);
    if (!urlResult.success) {
      ctx.addIssue({
        code: "custom",
        path: ["server_url"],
        message: "Server URL must be valid.",
      });
    }
  }

  if (
    value.transport !== "stdio" &&
    value.auth_type === "bearer" &&
    !value.bearer_token
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["bearer_token"],
      message: "Bearer token is required when auth type is bearer.",
    });
  }

  try {
    parseMcpArgs(value.args);
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      path: ["args"],
      message:
        error instanceof Error
          ? error.message
          : "Args must be a JSON array of strings.",
    });
  }

  try {
    parseMcpStringRecord(value.headers, "Headers");
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      path: ["headers"],
      message:
        error instanceof Error
          ? error.message
          : "Headers must be a JSON object of string values.",
    });
  }

  try {
    parseMcpStringRecord(value.env, "Environment variables");
  } catch (error) {
    ctx.addIssue({
      code: "custom",
      path: ["env"],
      message:
        error instanceof Error
          ? error.message
          : "Environment variables must be a JSON object of string values.",
    });
  }
}

export const mcpConnectionConfigSchema = z
  .object(mcpConnectionFields)
  .superRefine(refineMcpConnectionConfig);

export const mcpConfigSchema = mcpConnectionConfigSchema
  .extend({
    available_tools: mcpAvailableToolsArraySchema.optional().default([]),
    selected_tools: mcpSelectedToolNamesArraySchema.optional().default([]),
  })
  .superRefine((value, ctx) => {
    try {
      parseMcpSelectedToolNamesForSave(value.selected_tools);
      assertMcpSelectedToolsAvailable({
        available_tools: value.available_tools,
        selected_tools: value.selected_tools,
      });
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        path: ["selected_tools"],
        message:
          error instanceof Error
            ? error.message
            : "Select at least one MCP tool.",
      });
    }
  });

export type McpConnectionConfig = z.infer<typeof mcpConnectionConfigSchema>;
export type McpConfig = z.infer<typeof mcpConfigSchema>;
