export const AUTH_COOKIE_NAME = "auth-token";

export const DEFAULT_REDIRECT = "/";

/** Path prefixes that require an auth cookie (see `isProtected`). */
export const PROTECTED_PREFIXES = ["/", "/w", "/p", "/profile"];

export const AUTH_PAGES = ["/sign-in", "/sign-up", "/forgot-password"];

export const PUBLIC_PAGES = ["/privacy-policy"];
