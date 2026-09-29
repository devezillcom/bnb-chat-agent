import {
  WEBSITE_EMBED_DEFAULT_POSITION,
  WEBSITE_EMBED_DEFAULT_PRIMARY_COLOR,
  WEBSITE_EMBED_SCRIPT_URL,
} from "../constants";

export type WebsiteEmbedCode = {
  inline: string;
  popup: string;
  codingAgentPrompt: string;
};

function describeAllowedOrigins(params: {
  allowAllOrigins: boolean;
  allowedOrigins: string[];
}) {
  if (params.allowAllOrigins) {
    return "The widget may load on any website.";
  }

  if (params.allowedOrigins.length === 1) {
    return `The widget may load only on ${params.allowedOrigins[0]}. Do not add it on any other origin.`;
  }

  return `The widget may load only on these origins: ${params.allowedOrigins.join(", ")}. Do not add it on any other origin.`;
}

export function buildWebsiteEmbedCode(params: {
  siteBaseUrl: string;
  publicKey: string;
  allowAllOrigins: boolean;
  allowedOrigins: string[];
  websiteName: string;
}): WebsiteEmbedCode {
  const siteBaseUrl = params.siteBaseUrl.replace(/\/$/, "");
  const targetId = "bnb-chat";
  const scriptLines = [
    "<script",
    `  src="${WEBSITE_EMBED_SCRIPT_URL}"`,
    `  data-public-key="${params.publicKey}"`,
    `  data-base-url="${siteBaseUrl}"`,
  ];
  const inline = [
    `<div id="${targetId}"></div>`,
    ...scriptLines,
    '  data-mode="inline"',
    `  data-target="${targetId}"`,
    `  data-primary-color="${WEBSITE_EMBED_DEFAULT_PRIMARY_COLOR}"`,
    "  async",
    "></script>",
  ].join("\n");
  const popup = [
    ...scriptLines,
    '  data-mode="popup"',
    `  data-primary-color="${WEBSITE_EMBED_DEFAULT_PRIMARY_COLOR}"`,
    `  data-position="${WEBSITE_EMBED_DEFAULT_POSITION}"`,
    "  async",
    "></script>",
  ].join("\n");

  const codingAgentPrompt = [
    `Add the chat widget for "${params.websiteName}" to this website.`,
    "",
    "Rules:",
    `- ${describeAllowedOrigins(params)}`,
    "- Keep the public key exactly as written. Do not generate a new key.",
    `- Load the script from ${WEBSITE_EMBED_SCRIPT_URL}. Do not copy or host the script yourself.`,
    `- Keep data-base-url as ${siteBaseUrl}. That is the chat API origin.`,
    `- data-primary-color is a #RRGGBB color. The default is ${WEBSITE_EMBED_DEFAULT_PRIMARY_COLOR}.`,
    `- Popup data-position is ${WEBSITE_EMBED_DEFAULT_POSITION} or bottom-left. Do not set data-position on the inline snippet.`,
    "- Inline data-target must match the element id.",
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
