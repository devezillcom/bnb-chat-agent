import { describe, expect, it } from "vitest";

import { mergeFacebookMessengerPendingMessages } from "./merge-facebook-messenger-pending-messages";

describe("mergeFacebookMessengerPendingMessages", () => {
  it("returns null for an empty batch", () => {
    expect(
      mergeFacebookMessengerPendingMessages({
        connectionId: "00000000-0000-4000-8000-000000000001",
        psid: "psid-1",
        messages: [],
      }),
    ).toBeNull();
  });

  it("merges text in chronological order and collects images", () => {
    const merged = mergeFacebookMessengerPendingMessages({
      connectionId: "00000000-0000-4000-8000-000000000001",
      psid: "psid-1",
      messages: [
        {
          mid: "mid-2",
          text: "next week",
          receivedAt: 2,
        },
        {
          mid: "mid-1",
          text: "hello",
          receivedAt: 1,
        },
        {
          mid: "mid-3",
          imageAttachments: [{ type: "image", url: "https://example.com/a.jpg" }],
          receivedAt: 3,
        },
      ],
    });

    expect(merged).toEqual({
      kind: "message",
      connectionId: "00000000-0000-4000-8000-000000000001",
      psid: "psid-1",
      mid: "mid-1",
      mids: ["mid-1", "mid-2", "mid-3"],
      text: "hello\nnext week",
      imageAttachments: [{ type: "image", url: "https://example.com/a.jpg" }],
      hasUnsupportedAttachments: undefined,
    });
  });

  it("flags unsupported attachments when any pending message has them", () => {
    const merged = mergeFacebookMessengerPendingMessages({
      connectionId: "00000000-0000-4000-8000-000000000001",
      psid: "psid-1",
      messages: [
        {
          mid: "mid-1",
          text: "hello",
          receivedAt: 1,
        },
        {
          mid: "mid-2",
          hasUnsupportedAttachments: true,
          receivedAt: 2,
        },
      ],
    });

    expect(merged?.hasUnsupportedAttachments).toBe(true);
  });
});
