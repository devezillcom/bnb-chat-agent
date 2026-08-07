import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  buildFacebookConnectErrorPath,
  buildFacebookSelectPagePath,
} from "@/lib/connections/utils/build-facebook-connect-path";
import {
  exchangeFacebookCodeForToken,
  getFacebookTokenExpiresAt,
} from "@/lib/connections/utils/exchange-facebook-token";
import {
  applyFacebookPendingOAuthCookie,
  clearFacebookOAuthStateCookie,
  readFacebookOAuthStateData,
} from "@/lib/connections/utils/facebook-oauth-cookie";

function redirectWithError(
  request: NextRequest,
  workspaceIndex: number,
  message: string,
) {
  const url = new URL(
    buildFacebookConnectErrorPath(String(workspaceIndex)),
    request.url,
  );
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const oauthCode = searchParams.get("code");
  const state = searchParams.get("state");

  if (!oauthCode || !state) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const savedState = await readFacebookOAuthStateData(session.id);

    if (state !== savedState.state) {
      return redirectWithError(
        request,
        savedState.workspaceIndex,
        "Invalid Facebook OAuth state.",
      );
    }

    const shortLivedToken = await exchangeFacebookCodeForToken(oauthCode);

    const response = NextResponse.redirect(
      new URL(
        buildFacebookSelectPagePath(savedState.workspaceIndex),
        process.env.NEXT_PUBLIC_APP_URL,
      ),
    );

    clearFacebookOAuthStateCookie(response);
    applyFacebookPendingOAuthCookie(response, {
      userId: session.id,
      workspaceId: savedState.workspaceId,
      userAccessToken: shortLivedToken.access_token,
      userTokenExpiresAt: getFacebookTokenExpiresAt(shortLivedToken.expires_in),
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
