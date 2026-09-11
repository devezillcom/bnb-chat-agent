import { describe, expect, it } from "vitest";

import { parseExcludeDomains } from "./parse-exclude-domains";

describe("parseExcludeDomains", () => {
  it("returns an empty list for blank input", () => {
    expect(parseExcludeDomains("")).toEqual([]);
    expect(parseExcludeDomains("   \n  ")).toEqual([]);
  });

  it("normalizes domains from newline-separated input", () => {
    expect(
      parseExcludeDomains("Example.com\nhttps://www.facebook.com/page"),
    ).toEqual(["example.com", "facebook.com"]);
  });

  it("deduplicates domains", () => {
    expect(parseExcludeDomains("example.com\nwww.example.com")).toEqual([
      "example.com",
    ]);
  });
});
