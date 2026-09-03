import { describe, expect, it } from "vitest";

import { toMcpToolInputJsonSchema, toMcpToolZodSchema } from "./to-mcp-tool-input-schema";

describe("toMcpToolInputJsonSchema", () => {
  it("defaults missing properties to an empty object", () => {
    expect(toMcpToolInputJsonSchema({ type: "object" })).toEqual({
      type: "object",
      properties: {},
    });
  });

  it("preserves required fields and extra schema keys", () => {
    expect(
      toMcpToolInputJsonSchema({
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
        $defs: { unused: { type: "string" } },
      }),
    ).toEqual({
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
      $defs: { unused: { type: "string" } },
    });
  });

  it("converts a simple MCP input schema to Zod", () => {
    const schema = toMcpToolZodSchema({
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    });

    expect(schema.safeParse({ query: "check-in" }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });
});
