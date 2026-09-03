import { describe, expect, it } from "vitest";

import { parseMcpToolArguments } from "./parse-mcp-tool-arguments";

describe("parseMcpToolArguments", () => {
  it("returns an empty object for missing input", () => {
    expect(parseMcpToolArguments()).toEqual({});
    expect(parseMcpToolArguments(undefined)).toEqual({});
    expect(parseMcpToolArguments("")).toEqual({});
  });

  it("passes through object arguments", () => {
    expect(parseMcpToolArguments({ query: "check-in" })).toEqual({
      query: "check-in",
    });
  });

  it("parses a JSON object string", () => {
    expect(parseMcpToolArguments('{"query":"check-in"}')).toEqual({
      query: "check-in",
    });
  });

  it("wraps non-object JSON values", () => {
    expect(parseMcpToolArguments('"hello"')).toEqual({ value: "hello" });
  });

  it("keeps invalid JSON as a raw string", () => {
    expect(parseMcpToolArguments("{not-json")).toEqual({ raw: "{not-json" });
  });
});
