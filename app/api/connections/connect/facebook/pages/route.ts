import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { listFacebookPagesForPendingOAuth } from "@/lib/connections/services/list-facebook-pages-for-pending-oauth";
import { readFacebookPendingOAuthData } from "@/lib/connections/utils/facebook-oauth-cookie";
import { checkRolePermission } from "@/lib/exposers/check-role-permission";
import { APIError } from "@/lib/exposers/api-error";
import { assertWorkspaceAccess } from "@/lib/workspaces/services/assert-workspace-access";

export async function GET() {
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

    const pages = await listFacebookPagesForPendingOAuth(session.id);

    return NextResponse.json({ pages });
  } catch (error) {
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
