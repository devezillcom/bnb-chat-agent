import { z } from "zod";

import {
  parseMcpArgs,
  parseMcpStringRecord,
} from "../utils/parse-mcp-config-values";

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

export const mcpConfigSchema = z
  .object({
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
  })
  .superRefine((value, ctx) => {
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
  });

export type McpConfig = z.infer<typeof mcpConfigSchema>;
