import { afterEach, describe, expect, it } from "vitest";

import { assertEmbedImageAttachments } from "./assert-embed-image-attachments";

const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const KEY = `workspaces/${WORKSPACE_ID}/chat-agent-images/file.jpg`;
const PUBLIC_BASE = "https://cdn.example";

describe("assertEmbedImageAttachments", () => {
  const previousPublicUrl = process.env.R2_PUBLIC_URL;

  afterEach(() => {
    if (previousPublicUrl === undefined) {
      delete process.env.R2_PUBLIC_URL;
      return;
    }

    process.env.R2_PUBLIC_URL = previousPublicUrl;
  });

  it("accepts an image stored under the workspace chat prefix", () => {
    process.env.R2_PUBLIC_URL = PUBLIC_BASE;

    expect(
      assertEmbedImageAttachments({
        workspaceId: WORKSPACE_ID,
        images: [
          {
            url: `${PUBLIC_BASE}/${KEY}`,
            key: KEY,
            mimeType: "image/jpeg",
            fileName: "room.jpg",
          },
        ],
      }),
    ).toEqual([
      {
        url: `${PUBLIC_BASE}/${KEY}`,
        key: KEY,
        mimeType: "image/jpeg",
        fileName: "room.jpg",
      },
    ]);
  });

  it("rejects an image URL outside the workspace store", () => {
    process.env.R2_PUBLIC_URL = PUBLIC_BASE;

    expect(() =>
      assertEmbedImageAttachments({
        workspaceId: WORKSPACE_ID,
        images: [{ url: "https://evil.example/photo.jpg", key: KEY }],
      }),
    ).toThrow(/invalid/i);
  });
});
