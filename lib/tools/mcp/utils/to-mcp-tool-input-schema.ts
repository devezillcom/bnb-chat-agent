import { z } from "zod";

export type McpToolInputJsonSchema = {
  type: "object";
  properties?: Record<string, object>;
  required?: string[];
  [key: string]: unknown;
};

export function toMcpToolInputJsonSchema(
  inputSchema: McpToolInputJsonSchema,
): Record<string, unknown> {
  const properties =
    inputSchema.properties && typeof inputSchema.properties === "object"
      ? inputSchema.properties
      : {};

  return {
    ...inputSchema,
    type: "object",
    properties,
  };
}

export function toMcpToolZodSchema(
  inputSchema: McpToolInputJsonSchema,
): z.ZodType {
  try {
    return z.fromJSONSchema(toMcpToolInputJsonSchema(inputSchema));
  } catch {
    return z.looseObject({});
  }
}
