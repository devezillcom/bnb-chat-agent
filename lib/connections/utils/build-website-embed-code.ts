import { WEBSITE_EMBED_SCRIPT_PATH } from "../constants";

export type WebsiteEmbedCode = {
  inline: string;
  popup: string;
  codingAgentPrompt: string;
};

export function buildWebsiteEmbedCode(params: {
  siteBaseUrl: string;
  publicKey: string;
  allowedOrigin: string;
  websiteName: string;
}): WebsiteEmbedCode {
  const siteBaseUrl = params.siteBaseUrl.replace(/\/$/, "");
  const scriptUrl = `${siteBaseUrl}${WEBSITE_EMBED_SCRIPT_PATH}`;
  const targetId = "bnb-chat";
  const inline = [
    `<div id="${targetId}"></div>`,
    "<script",
    `  src="${scriptUrl}"`,
    `  data-public-key="${params.publicKey}"`,
    '  data-mode="inline"',
    `  data-target="${targetId}"`,
    "  async",
    "></script>",
  ].join("\n");
  const popup = [
    "<script",
    `  src="${scriptUrl}"`,
    `  data-public-key="${params.publicKey}"`,
    '  data-mode="popup"',
    "  async",
    "></script>",
  ].join("\n");

  const codingAgentPrompt = [
    `Add the chat widget for "${params.websiteName}" to this website.`,
    "",
    "Rules:",
    `- The widget may load only on ${params.allowedOrigin}. Do not add it on any other origin.`,
    "- Keep the public key exactly as written. Do not generate a new key.",
    `- Load the script from ${scriptUrl}. Do not copy or host the script yourself.`,
    "- Pick one placement:",
    "  1. Inline — put the chat inside a specific page.",
    "  2. Popup button — add a corner button that opens the chat, usually from the root layout so it shows on every page.",
    "- If the site already has a shared layout, prefer the popup snippet there unless the user asked for an inline chat on one page.",
    "",
    "Inline snippet:",
    inline,
    "",
    "Popup snippet:",
    popup,
  ].join("\n");

  return {
    inline,
    popup,
    codingAgentPrompt,
  };
}
