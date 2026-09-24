export const SLUG_MAX_LENGTH = 64;

/**
 * Turns a human display name into a lowercase `snake_case` identifier that is
 * safe to use as an LLM tool name (`^[a-z0-9_]+$`, max 64 chars). Diacritics
 * are stripped (including Vietnamese `đ`) so "Hỗ trợ đặt phòng" becomes
 * `ho_tro_dat_phong`. Returns `fallback` when nothing usable remains.
 */
export function slugifyName(name: string, fallback = "item"): string {
  const slug = name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/_+$/g, "");

  return slug.length > 0 ? slug : fallback;
}
