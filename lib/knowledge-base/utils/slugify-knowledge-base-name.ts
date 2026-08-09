export function slugifyKnowledgeBaseName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length > 0 ? normalized : "knowledge-base";
}

export async function ensureUniqueKnowledgeBaseSlug(params: {
  workspaceId: string;
  baseSlug: string;
  exists: (slug: string) => Promise<boolean>;
}): Promise<string> {
  let slug = params.baseSlug;
  let suffix = 2;

  while (await params.exists(slug)) {
    slug = `${params.baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
