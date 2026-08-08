const DEFAULT_BASE_URL = "https://dev.boxx.vn";

export function getSiteBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULT_BASE_URL;
}
