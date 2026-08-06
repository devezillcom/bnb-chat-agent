import { AUTH_PAGES, PROTECTED_PREFIXES, PUBLIC_PAGES } from "./constants";

export function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isProtected(pathname: string): boolean {
  if (isPublicPage(pathname)) return false;
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
