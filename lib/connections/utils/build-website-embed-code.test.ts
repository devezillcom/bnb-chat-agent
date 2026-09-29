import { describe, expect, it } from "vitest";

import { buildWebsiteEmbedCode } from "./build-website-embed-code";

describe("buildWebsiteEmbedCode", () => {
  it("builds inline, popup, and coding-agent snippets from the public key", () => {
    const code = buildWebsiteEmbedCode({
      siteBaseUrl: "https://app.example.com/",
      publicKey: "pub_key",
      allowAllOrigins: false,
      allowedOrigins: ["https://example.com", "https://shop.example.com"],
      websiteName: "Booking site",
    });

    expect(code.inline).toContain('data-mode="inline"');
    expect(code.inline).toContain('data-public-key="pub_key"');
    expect(code.inline).toContain('data-target="bnb-chat"');
    expect(code.inline).toContain('data-base-url="https://app.example.com"');
    expect(code.inline).toContain('data-primary-color="#18181b"');
    expect(code.inline).not.toContain("data-position");
    expect(code.inline).toContain(
      'src="https://bnb-chat-agent-widget.bienhinh.vn/bnb-chat.js"',
    );
    expect(code.popup).toContain('data-mode="popup"');
    expect(code.popup).toContain('data-base-url="https://app.example.com"');
    expect(code.popup).toContain('data-primary-color="#18181b"');
    expect(code.popup).toContain('data-position="bottom-right"');
    expect(code.popup).not.toContain("data-target");
    expect(code.codingAgentPrompt).toContain(
      "https://example.com, https://shop.example.com",
    );
    expect(code.codingAgentPrompt).toContain("Booking site");
    expect(code.codingAgentPrompt).toContain(code.inline);
    expect(code.codingAgentPrompt).toContain(code.popup);
  });
});
