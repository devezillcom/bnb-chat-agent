import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { completeFacebookConnectSchema } from "@/lib/connections/schema";
import { completeFacebookConnectionConnect } from "@/lib/connections/services/complete-facebook-connection-connect";
import {
  clearFacebookPendingOAuthCookie,
  readFacebookPendingOAuthData,
} from "@/lib/connections/utils/facebook-oauth-cookie";
import { checkRolePermission } from "@/lib/exposers/check-role-permission";
import { APIError } from "@/lib/exposers/api-error";
import { assertWorkspaceAccess } from "@/lib/workspaces/services/assert-workspace-access";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    checkRolePermission(session, ["user", "admin"]);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await readFacebookPendingOAuthData(session.id);
    await assertWorkspaceAccess({
      userId: session.id,
      workspaceId: pending.workspaceId,
      minPermission: "edit",
    });

    const body = await request.json().catch(() => null);
    const params = completeFacebookConnectSchema.parse(body);

    const result = await completeFacebookConnectionConnect({
      userId: session.id,
      pageIds: params.pageIds,
    });

    const response = NextResponse.json(result);
    clearFacebookPendingOAuthCookie(response);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      const message =
        first && "message" in first ? String(first.message) : "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
