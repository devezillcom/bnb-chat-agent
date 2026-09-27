import { describe, expect, it } from "vitest";

import { buildWebsiteEmbedCode } from "./build-website-embed-code";

describe("buildWebsiteEmbedCode", () => {
  it("builds inline, popup, and coding-agent snippets from the public key", () => {
    const code = buildWebsiteEmbedCode({
      siteBaseUrl: "https://app.example.com/",
      publicKey: "pub_key",
      allowedOrigin: "https://example.com",
      websiteName: "Booking site",
    });

    expect(code.inline).toContain('data-mode="inline"');
    expect(code.inline).toContain('data-public-key="pub_key"');
    expect(code.inline).toContain(
      'src="https://app.example.com/embed/chat.js"',
    );
    expect(code.popup).toContain('data-mode="popup"');
    expect(code.popup).not.toContain("data-target");
    expect(code.codingAgentPrompt).toContain("https://example.com");
    expect(code.codingAgentPrompt).toContain("Booking site");
    expect(code.codingAgentPrompt).toContain(code.inline);
    expect(code.codingAgentPrompt).toContain(code.popup);
  });
});
