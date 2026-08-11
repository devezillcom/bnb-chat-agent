import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { isTokenNotExpired } from "@/lib/auth/token";
import { isProtected } from "@/lib/auth/utils";

export function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasToken = !!token;
  // const hasAuth = token ? isTokenNotExpired(token) : false;
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Disabled because the refresh and sync token will trigger on client side and route protected by client side
  // if (hasToken && !hasAuth) {
  //   const refreshUrl = new URL("/session-refresh", req.url);
  //   refreshUrl.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(refreshUrl);
  // }

  // Disabled since we let client handle the redirect to sign-in
  // if (!hasToken) {
  //   console.log('has no token, redirect to sign-in', pathname);
  //   const signIn = new URL("/sign-in", req.url);
  //   signIn.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(signIn);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
