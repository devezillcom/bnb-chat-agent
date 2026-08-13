import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateKnowledgeBaseParams, UpdateKnowledgeBaseResult } from "../types";
import {
  ensureUniqueKnowledgeBaseSlug,
  slugifyKnowledgeBaseName,
} from "../utils/slugify-knowledge-base-name";

export async function updateKnowledgeBase(
  params: UpdateKnowledgeBaseParams,
): Promise<UpdateKnowledgeBaseResult> {
  const name = params.name.trim();
  const baseSlug = slugifyKnowledgeBaseName(name);
  const slug = await ensureUniqueKnowledgeBaseSlug({
    workspaceId: params.workspaceId,
    baseSlug,
    exists: async (candidate) => {
      const [existing] = await db
        .select({ id: knowledgeBases.id })
        .from(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.workspaceId, params.workspaceId),
            eq(knowledgeBases.slug, candidate),
            ne(knowledgeBases.id, params.knowledgeBaseId),
          ),
        )
        .limit(1);

      return Boolean(existing);
    },
  });

  const [knowledgeBase] = await db
    .update(knowledgeBases)
    .set({
      name,
      slug,
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
