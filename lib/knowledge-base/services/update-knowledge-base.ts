import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateKnowledgeBaseParams, UpdateKnowledgeBaseResult } from "../types";

export async function updateKnowledgeBase(
  params: UpdateKnowledgeBaseParams,
): Promise<UpdateKnowledgeBaseResult> {
  const name = params.name.trim();

  const [knowledgeBase] = await db
    .update(knowledgeBases)
    .set({
      name,
      description: params.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(knowledgeBases.id, params.knowledgeBaseId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: knowledgeBases.id });

  if (!knowledgeBase) {
    throw new APIError(
      "ERR_KB_NOT_FOUND",
      "Knowledge base not found.",
      404,
    );
  }

  return {
    message: "Knowledge base updated.",
  };
}
