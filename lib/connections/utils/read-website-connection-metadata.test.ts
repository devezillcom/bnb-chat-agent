import { describe, expect, it } from "vitest";

import { readWebsiteConnectionMetadata } from "./read-website-connection-metadata";

describe("readWebsiteConnectionMetadata", () => {
  it("reads a list of allowed origins", () => {
    expect(
      readWebsiteConnectionMetadata({
        allow_all_origins: false,
        allowed_origins: ["https://example.com", "https://shop.example.com"],
      }),
    ).toEqual({
      allow_all_origins: false,
      allowed_origins: ["https://example.com", "https://shop.example.com"],
    });
  });

  it("reads allow-all and ignores leftover origins", () => {
    expect(
      readWebsiteConnectionMetadata({
        allow_all_origins: true,
        allowed_origins: ["https://example.com"],
      }),
    ).toEqual({
      allow_all_origins: true,
      allowed_origins: [],
    });
  });

  it("reads a legacy single origin", () => {
    expect(
      readWebsiteConnectionMetadata({
        website_url: "https://example.com/booking",
        allowed_origin: "https://example.com",
      }),
    ).toEqual({
      allow_all_origins: false,
      allowed_origins: ["https://example.com"],
    });
  });
});
