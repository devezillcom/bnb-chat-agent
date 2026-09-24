import "server-only";

import { knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";

import type { CreateKnowledgeBaseParams, CreateKnowledgeBaseResult } from "../types";

export async function createKnowledgeBase(
  params: CreateKnowledgeBaseParams,
): Promise<CreateKnowledgeBaseResult> {
  const name = params.name.trim();

  const [knowledgeBase] = await db
    .insert(knowledgeBases)
    .values({
      workspaceId: params.workspaceId,
      name,
      description: params.description?.trim() || null,
    })
    .returning({ id: knowledgeBases.id });

  if (!knowledgeBase) {
    throw new Error("Failed to create knowledge base.");
  }

  return {
    id: knowledgeBase.id,
    message: "Knowledge base created.",
  };
}
