import { describe, expect, it } from "vitest";

import { isWebsiteOriginAllowed } from "./is-website-origin-allowed";
import { normalizeWebsiteOrigin } from "./normalize-website-origin";
import { normalizeWebsiteOrigins } from "./normalize-website-origins";

describe("normalizeWebsiteOrigin", () => {
  it("adds https and drops the path", () => {
    expect(normalizeWebsiteOrigin("example.com")).toBe("https://example.com");
    expect(normalizeWebsiteOrigin("https://Example.com/booking")).toBe(
      "https://example.com",
    );
  });

  it("keeps a non-default port", () => {
    expect(normalizeWebsiteOrigin("http://localhost:3000/chat")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeWebsiteOrigin("localhost:3000")).toBe(
      "https://localhost:3000",
    );
  });

  it("rejects non-http protocols and credentials", () => {
    expect(() => normalizeWebsiteOrigin("javascript:alert(1)")).toThrow(
      /http:\/\/ or https:\/\//,
    );
    expect(() => normalizeWebsiteOrigin("https://user:pass@example.com")).toThrow(
      /username or password/,
    );
  });
});

describe("normalizeWebsiteOrigins", () => {
  it("dedupes values that share an origin and skips blanks", () => {
    expect(
      normalizeWebsiteOrigins([
        "example.com",
        "  ",
        "https://shop.example.com/path",
      ]),
    ).toEqual(["https://example.com", "https://shop.example.com"]);
  });

  it("rejects the same origin entered twice", () => {
    expect(() =>
      normalizeWebsiteOrigins(["example.com", "https://example.com/booking"]),
    ).toThrow(/already in the list/);
  });
});

describe("isWebsiteOriginAllowed", () => {
  it("matches one origin in the list", () => {
    expect(
      isWebsiteOriginAllowed({
        origin: "https://Example.com",
        allowAllOrigins: false,
        allowedOrigins: ["https://example.com"],
      }),
    ).toBe(true);
    expect(
      isWebsiteOriginAllowed({
        origin: "https://www.example.com",
        allowAllOrigins: false,
        allowedOrigins: ["https://example.com"],
      }),
    ).toBe(false);
  });

  it("allows any http origin when allow-all is on", () => {
    expect(
      isWebsiteOriginAllowed({
        origin: "http://localhost:5173",
        allowAllOrigins: true,
        allowedOrigins: [],
      }),
    ).toBe(true);
    expect(
      isWebsiteOriginAllowed({
        origin: "chrome-extension://abc",
        allowAllOrigins: true,
        allowedOrigins: [],
      }),
    ).toBe(false);
  });
});
