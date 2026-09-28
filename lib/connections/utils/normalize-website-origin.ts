const WEBSITE_ORIGIN_MAX_LENGTH = 300;

function toWebsiteOriginInput(trimmed: string) {
  if (trimmed.includes("://")) {
    return trimmed;
  }

  if (/^[^/\s]+:\d+(?:[/?#]|$)/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeWebsiteOrigin(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a website domain.");
  }

  if (trimmed.length > WEBSITE_ORIGIN_MAX_LENGTH) {
    throw new Error("Website domain is too long.");
  }

  const withProtocol = toWebsiteOriginInput(trimmed);

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid website domain.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Website domain must use http:// or https://.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Website domain cannot include a username or password.");
  }

  if (!parsed.hostname || parsed.hostname === ".") {
    throw new Error("Enter a valid website domain.");
  }

  return parsed.origin;
}
