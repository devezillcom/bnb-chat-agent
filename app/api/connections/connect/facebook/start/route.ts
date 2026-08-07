import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  FACEBOOK_OAUTH_DIALOG_URL,
  FACEBOOK_OAUTH_SCOPES,
} from "@/lib/connections/constants";
import { buildFacebookConnectErrorPath } from "@/lib/connections/utils/build-facebook-connect-path";
import { applyFacebookOAuthStateCookie } from "@/lib/connections/utils/facebook-oauth-cookie";
import {
  getFacebookAppId,
  getFacebookOAuthRedirectUri,
} from "@/lib/connections/utils/get-facebook-config";
import { assertWorkspaceAccess } from "@/lib/workspaces/services/assert-workspace-access";
import { X_WORKSPACE_ID_HEADER } from "@/lib/workspaces/constants";
import { parseWorkspaceIndexParam } from "@/lib/workspaces/utils/parse-workspace-index-param";

function redirectWithConnectError(
  request: NextRequest,
  workspaceIndexParam: string,
  message: string,
) {
  const url = new URL(
    buildFacebookConnectErrorPath(workspaceIndexParam),
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

  const workspaceId =
    request.headers.get(X_WORKSPACE_ID_HEADER)?.trim() ??
    request.nextUrl.searchParams.get("workspaceId")?.trim();
  const workspaceIndexParam =
    request.nextUrl.searchParams.get("workspaceIndex")?.trim() ?? "";
  const parsedWorkspaceIndex = parseWorkspaceIndexParam(workspaceIndexParam);

  if (!workspaceId || parsedWorkspaceIndex === null) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await assertWorkspaceAccess({
      userId: session.id,
      workspaceId,
      minPermission: "edit",
    });

    const appId = getFacebookAppId();
    const redirectUri = getFacebookOAuthRedirectUri();
    const state = randomBytes(24).toString("hex");

    const authUrl = new URL(FACEBOOK_OAUTH_DIALOG_URL);
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", FACEBOOK_OAUTH_SCOPES.join(","));

    const response = NextResponse.redirect(authUrl);
    applyFacebookOAuthStateCookie(response, {
      state,
      userId: session.id,
      workspaceId,
      workspaceIndex: parsedWorkspaceIndex,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start Facebook OAuth.";
    return redirectWithConnectError(request, workspaceIndexParam, message);
  }
}
