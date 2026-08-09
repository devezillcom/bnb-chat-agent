import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

export async function validateSkillToolSlugs(
  workspaceId: string,
  toolSlugs: string[],
): Promise<string[]> {
  const normalizedSlugs = [...new Set(toolSlugs.map((slug) => slug.trim()).filter(Boolean))];

  if (normalizedSlugs.length === 0) {
    return [];
  }

  const rows = await db
    .select({ slug: tools.slug })
    .from(tools)
    .where(
      and(
        eq(tools.workspaceId, workspaceId),
        inArray(tools.slug, normalizedSlugs),
      ),
    );

  const existingSlugs = new Set(rows.map((row) => row.slug));
  const invalidSlugs = normalizedSlugs.filter((slug) => !existingSlugs.has(slug));

  if (invalidSlugs.length > 0) {
    throw new APIError(
      "ERR_SKILL_TOOL_SLUG_INVALID",
      `Unknown tool slug(s): ${invalidSlugs.join(", ")}.`,
      400,
    );
  }

  return normalizedSlugs;
}
