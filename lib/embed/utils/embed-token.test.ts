import { afterEach, describe, expect, it } from "vitest";

import { EMBED_TOKEN_TTL_SECONDS } from "../constants";
import { createEmbedToken, verifyEmbedToken } from "./embed-token";

const CONNECTION_ID = "11111111-1111-4111-8111-111111111111";
const ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

describe("embed token", () => {
  const previousKey = process.env.SECRET_DATA_ENCRYPTION_KEY;

  afterEach(() => {
    if (previousKey === undefined) {
      delete process.env.SECRET_DATA_ENCRYPTION_KEY;
      return;
    }

    process.env.SECRET_DATA_ENCRYPTION_KEY = previousKey;
  });

  it("round-trips a connection id until the token expires", () => {
    process.env.SECRET_DATA_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const now = Date.parse("2026-09-27T00:00:00.000Z");
    const token = createEmbedToken(CONNECTION_ID, now);

    expect(verifyEmbedToken(token, now + 1_000)).toEqual({
      connectionId: CONNECTION_ID,
      exp: Math.floor(now / 1000) + EMBED_TOKEN_TTL_SECONDS,
    });

    expect(() =>
      verifyEmbedToken(token, now + EMBED_TOKEN_TTL_SECONDS * 1000),
    ).toThrow(/expired/i);
  });

  it("rejects a token signed with a different key", () => {
    process.env.SECRET_DATA_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const token = createEmbedToken(CONNECTION_ID, Date.now());
    process.env.SECRET_DATA_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString("base64");

    expect(() => verifyEmbedToken(token)).toThrow(/invalid/i);
  });
});
