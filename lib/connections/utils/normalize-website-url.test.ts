import { describe, expect, it } from "vitest";

import { normalizeWebsiteUrl } from "./normalize-website-url";

describe("normalizeWebsiteUrl", () => {
  it("adds https and stores the origin for a bare host", () => {
    expect(normalizeWebsiteUrl("example.com")).toEqual({
      websiteUrl: "https://example.com",
      allowedOrigin: "https://example.com",
    });
  });

  it("keeps a path and uses the origin as the allowlist", () => {
    expect(normalizeWebsiteUrl("https://Example.com/booking")).toEqual({
      websiteUrl: "https://example.com/booking",
      allowedOrigin: "https://example.com",
    });
  });

  it("keeps the port on local origins", () => {
    expect(normalizeWebsiteUrl("http://localhost:3000/chat")).toEqual({
      websiteUrl: "http://localhost:3000/chat",
      allowedOrigin: "http://localhost:3000",
    });
  });

  it("rejects non-http protocols", () => {
    expect(() => normalizeWebsiteUrl("javascript:alert(1)")).toThrow(
      /http:\/\/ or https:\/\//,
    );
  });
});
