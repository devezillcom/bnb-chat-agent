import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { APIError } from "@/lib/exposers/api-error";
import { getKnowledgeBaseDocumentViewUrl } from "@/lib/knowledge-base/services/get-knowledge-base-document-view-url";
import { assertWorkspaceAccess } from "@/lib/workspaces/services/assert-workspace-access";
import { listWorkspacesForUser } from "@/lib/workspaces/services/list-workspaces-for-user";
import {
  clampWorkspaceIndex,
  parseWorkspaceIndexParam,
} from "@/lib/workspaces/utils/parse-workspace-index-param";

type KnowledgeBaseDocumentViewRouteContext = {
  params: Promise<{ workspaceIndex: string; kbId: string; docId: string }>;
};

export async function GET(
  request: NextRequest,
  context: KnowledgeBaseDocumentViewRouteContext,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const { workspaceIndex: workspaceIndexParam, kbId, docId } =
    await context.params;

  const parsedIndex = parseWorkspaceIndexParam(workspaceIndexParam);
  const { items: workspaces } = await listWorkspacesForUser({
    userId: session.id,
  });

  if (workspaces.length === 0 || parsedIndex === null) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const workspaceIndex = clampWorkspaceIndex(parsedIndex, workspaces.length);
  if (parsedIndex !== workspaceIndex) {
    return NextResponse.redirect(new URL(`/w/${workspaceIndex}`, request.url));
  }

  const workspace = workspaces[workspaceIndex];

  try {
    await assertWorkspaceAccess({
      userId: session.id,
      workspaceId: workspace.id,
      minPermission: "read",
    });

    const { viewUrl } = await getKnowledgeBaseDocumentViewUrl({
      workspaceId: workspace.id,
      knowledgeBaseId: kbId,
      documentId: docId,
    });

    return NextResponse.redirect(viewUrl);
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 404) {
      return new NextResponse("Not found", { status: 404 });
    }

    throw error;
  }
}
