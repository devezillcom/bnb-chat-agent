import { describe, expect, it } from "vitest";

import { normalizeConversationStarters } from "./normalize-conversation-starters";

describe("normalizeConversationStarters", () => {
  it("keeps trimmed prompts and drops blanks", () => {
    expect(
      normalizeConversationStarters([
        "  Check-in time? ",
        "",
        "   ",
        "Parking?",
      ]),
    ).toEqual(["Check-in time?", "Parking?"]);
  });

  it("ignores values that are not strings", () => {
    expect(normalizeConversationStarters(["Hi", 1, null, { text: "No" }])).toEqual([
      "Hi",
    ]);
  });

  it("returns an empty list for missing values", () => {
    expect(normalizeConversationStarters(null)).toEqual([]);
  });

  it("caps the list at six prompts", () => {
    expect(
      normalizeConversationStarters([
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
      ]),
    ).toEqual(["one", "two", "three", "four", "five", "six"]);
  });
});
