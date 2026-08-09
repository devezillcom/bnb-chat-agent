import "server-only";

import { and, eq } from "drizzle-orm";

import { knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { CreateKnowledgeBaseParams, CreateKnowledgeBaseResult } from "../types";
import {
  ensureUniqueKnowledgeBaseSlug,
  slugifyKnowledgeBaseName,
} from "../utils/slugify-knowledge-base-name";

export async function createKnowledgeBase(
  params: CreateKnowledgeBaseParams,
): Promise<CreateKnowledgeBaseResult> {
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
          ),
        )
        .limit(1);

      return Boolean(existing);
    },
  });

  const [knowledgeBase] = await db
    .insert(knowledgeBases)
    .values({
      workspaceId: params.workspaceId,
      name,
      slug,
      description: params.description?.trim() || null,
    })
    .returning({ id: knowledgeBases.id, slug: knowledgeBases.slug });

  if (!knowledgeBase) {
    throw new Error("Failed to create knowledge base.");
  }

  return {
    id: knowledgeBase.id,
    slug: knowledgeBase.slug,
    message: "Knowledge base created.",
  };
}
