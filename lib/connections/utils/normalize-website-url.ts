export type NormalizedWebsiteUrl = {
  websiteUrl: string;
  allowedOrigin: string;
};

export function normalizeWebsiteUrl(input: string): NormalizedWebsiteUrl {
  const trimmed = input.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid website URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Website URL must start with http:// or https://.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Website URL cannot include a username or password.");
  }

  if (!parsed.hostname) {
    throw new Error("Enter a valid website URL.");
  }

  parsed.hash = "";

  const websiteUrl =
    parsed.pathname === "/" && !parsed.search
      ? parsed.origin
      : parsed.toString();

  return {
    websiteUrl,
    allowedOrigin: parsed.origin,
  };
}
