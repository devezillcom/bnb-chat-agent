import { describe, expect, it } from "vitest";

import { slugifyName } from "./slugify-name";

describe("slugifyName", () => {
  it("lowercases and joins words with underscores", () => {
    expect(slugifyName("Get Weather")).toBe("get_weather");
    expect(slugifyName("  HTTP API  ")).toBe("http_api");
  });

  it("strips Vietnamese diacritics including đ", () => {
    expect(slugifyName("Hỗ trợ đặt phòng")).toBe("ho_tro_dat_phong");
    expect(slugifyName("Đơn hàng")).toBe("don_hang");
  });

  it("collapses punctuation runs and trims underscores", () => {
    expect(slugifyName("Docs -- MCP (v2)!")).toBe("docs_mcp_v2");
  });

  it("keeps an existing snake_case identifier unchanged", () => {
    expect(slugifyName("guest_support")).toBe("guest_support");
  });

  it("falls back when nothing usable remains", () => {
    expect(slugifyName("🔥🔥")).toBe("item");
    expect(slugifyName("!!!", "tool")).toBe("tool");
  });

  it("caps the slug at 64 characters without a trailing underscore", () => {
    const slug = slugifyName(`${"a".repeat(63)} b c`);

    expect(slug.length).toBeLessThanOrEqual(64);
    expect(slug.endsWith("_")).toBe(false);
  });
});
