import { describe, expect, it } from "vitest";

import { applyMentionSlugs } from "./apply-mention-slugs";

const items = [
  { name: "Get Weather", slug: "get_weather" },
  { name: "Get Weather Forecast", slug: "get_weather_forecast" },
  { name: "Hỗ trợ khách", slug: "ho_tro_khach" },
  {
    name: "Web Search (web_get_content)",
    slug: "web_search__web_get_content",
  },
];

describe("applyMentionSlugs", () => {
  it("rewrites @Name mentions to the backticked slug", () => {
    expect(applyMentionSlugs("Use @Get Weather for weather.", items)).toBe(
      "Use `get_weather` for weather.",
    );
  });

  it("prefers the longest matching name", () => {
    expect(applyMentionSlugs("Call @Get Weather Forecast now", items)).toBe(
      "Call `get_weather_forecast` now",
    );
  });

  it("handles names with spaces and diacritics", () => {
    expect(
      applyMentionSlugs("Khi khách hỏi, dùng @Hỗ trợ khách.", items),
    ).toBe("Khi khách hỏi, dùng `ho_tro_khach`.");
  });

  it("leaves unknown mentions and emails untouched", () => {
    const prompt = "Email me at me@example.com or ping @Someone Else.";

    expect(applyMentionSlugs(prompt, items)).toBe(prompt);
  });

  it("rewrites child tool mentions to the prefixed LangChain tool name", () => {
    expect(
      applyMentionSlugs("Fetch with @Web Search (web_get_content).", items),
    ).toBe("Fetch with `web_search__web_get_content`.");
  });

  it("rewrites multiple mentions, including adjacent ones", () => {
    expect(
      applyMentionSlugs("@Get Weather then @Hỗ trợ khách; @Get Weather", items),
    ).toBe("`get_weather` then `ho_tro_khach`; `get_weather`");
  });

  it("returns the prompt unchanged when there are no items", () => {
    expect(applyMentionSlugs("Use @Get Weather", [])).toBe("Use @Get Weather");
  });
});
