import { describe, expect, it } from "vitest";

import { parseMcpArgs, parseMcpStringRecord } from "./parse-mcp-config-values";

describe("parseMcpArgs", () => {
  it("returns an empty array for blank input", () => {
    expect(parseMcpArgs("")).toEqual([]);
    expect(parseMcpArgs("   ")).toEqual([]);
  });

  it("parses a JSON array of strings", () => {
    expect(parseMcpArgs('["-y", " @modelcontextprotocol/server-github "]')).toEqual(
      ["-y", "@modelcontextprotocol/server-github"],
    );
  });

  it("splits whitespace-separated args", () => {
    expect(parseMcpArgs("-y @modelcontextprotocol/server-github")).toEqual([
      "-y",
      "@modelcontextprotocol/server-github",
    ]);
  });

  it("rejects a JSON array with non-string values", () => {
    expect(() => parseMcpArgs("[1, 2]")).toThrow(
      "Args must be a JSON array of strings.",
    );
  });

  it("rejects invalid JSON arrays", () => {
    expect(() => parseMcpArgs("[not-json")).toThrow(
      "Args must be a JSON array of strings.",
    );
  });
});

describe("parseMcpStringRecord", () => {
  it("returns an empty object for blank input", () => {
    expect(parseMcpStringRecord("", "Headers")).toEqual({});
  });

  it("parses a JSON object of strings", () => {
    expect(
      parseMcpStringRecord(
        '{ "X-API-Key": " secret ", "Accept": "application/json" }',
        "Headers",
      ),
    ).toEqual({
      "X-API-Key": "secret",
      Accept: "application/json",
    });
  });

  it("parses KEY=value lines and ignores comments", () => {
    expect(
      parseMcpStringRecord(
        "# token\nGITHUB_TOKEN=abc123\nEMPTY=\n",
        "Environment variables",
      ),
    ).toEqual({
      GITHUB_TOKEN: "abc123",
      EMPTY: "",
    });
  });

  it("rejects JSON objects with non-string values", () => {
    expect(() => parseMcpStringRecord('{ "count": 1 }', "Headers")).toThrow(
      "Headers must be a JSON object of string values.",
    );
  });

  it("rejects malformed KEY=value lines", () => {
    expect(() => parseMcpStringRecord("TOKEN", "Headers")).toThrow(
      "Headers must use KEY=value lines or a JSON object of string values.",
    );
  });
});
