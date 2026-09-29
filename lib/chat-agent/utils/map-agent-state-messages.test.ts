import { describe, expect, it } from "vitest";

import { mapAgentStateMessagesToChatMessages } from "./map-agent-state-messages";

describe("mapAgentStateMessagesToChatMessages", () => {
  it("copies createdAt from additional_kwargs", () => {
    const messages = mapAgentStateMessagesToChatMessages([
      {
        type: "human",
        content: "Hello",
        additional_kwargs: { createdAt: "2026-09-29T04:12:00.000Z" },
      },
      {
        type: "ai",
        content: "Hi",
        additional_kwargs: { createdAt: "2026-09-29T04:12:08.000Z" },
      },
    ]);

    expect(messages).toEqual([
      {
        role: "user",
        content: "Hello",
        images: undefined,
        createdAt: "2026-09-29T04:12:00.000Z",
      },
      {
        role: "assistant",
        content: "Hi",
        createdAt: "2026-09-29T04:12:08.000Z",
      },
    ]);
  });

  it("omits createdAt when the state message has none", () => {
    const messages = mapAgentStateMessagesToChatMessages([
      { type: "human", content: "Hello" },
      {
        type: "ai",
        content: "Hi",
        additional_kwargs: { createdAt: "not-a-date" },
      },
    ]);

    expect(messages).toEqual([
      { role: "user", content: "Hello", images: undefined },
      { role: "assistant", content: "Hi" },
    ]);
  });
});
