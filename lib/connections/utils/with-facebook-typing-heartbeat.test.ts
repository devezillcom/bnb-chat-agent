import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./send-facebook-messenger-message", () => ({
  sendFacebookMessengerSenderAction: vi.fn(),
}));

import { FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS } from "../constants";
import { sendFacebookMessengerSenderAction } from "./send-facebook-messenger-message";
import { withFacebookTypingHeartbeat } from "./with-facebook-typing-heartbeat";

describe("withFacebookTypingHeartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(sendFacebookMessengerSenderAction).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("sends typing_on immediately and refreshes while work runs", async () => {
    let resolve!: (value: string) => void;
    const promise = new Promise<string>((res) => {
      resolve = res;
    });

    const resultPromise = withFacebookTypingHeartbeat(
      { pageAccessToken: "token", psid: "psid-1" },
      () => promise,
    );

    await vi.waitFor(() => {
      expect(sendFacebookMessengerSenderAction).toHaveBeenCalledTimes(1);
    });
    expect(sendFacebookMessengerSenderAction).toHaveBeenCalledWith({
      pageAccessToken: "token",
      psid: "psid-1",
      action: "typing_on",
    });

    await vi.advanceTimersByTimeAsync(
      FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS,
    );
    expect(sendFacebookMessengerSenderAction).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(
      FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS,
    );
    expect(sendFacebookMessengerSenderAction).toHaveBeenCalledTimes(3);

    resolve("done");
    await expect(resultPromise).resolves.toBe("done");

    await vi.advanceTimersByTimeAsync(
      FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS,
    );
    expect(sendFacebookMessengerSenderAction).toHaveBeenCalledTimes(3);
  });

  it("stops the heartbeat when work throws", async () => {
    await expect(
      withFacebookTypingHeartbeat(
        { pageAccessToken: "token", psid: "psid-1" },
        async () => {
          throw new Error("fail");
        },
      ),
    ).rejects.toThrow("fail");

    await vi.advanceTimersByTimeAsync(
      FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS * 2,
    );
    expect(sendFacebookMessengerSenderAction).toHaveBeenCalledTimes(1);
  });
});
