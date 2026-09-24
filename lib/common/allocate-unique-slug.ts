import { SLUG_MAX_LENGTH } from "./slugify-name";

/**
 * Returns `base` if it is not in `used`, otherwise the first free
 * `base_2`, `base_3`, … candidate (trimming `base` so the result stays within
 * `maxLength`). The chosen slug is added to `used`.
 */
export function allocateUniqueSlug(
  base: string,
  used: Set<string>,
  maxLength = SLUG_MAX_LENGTH,
): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  for (let index = 2; index < 1000; index += 1) {
    const suffix = `_${index}`;
    const candidate = `${base.slice(0, maxLength - suffix.length)}${suffix}`;

    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  throw new Error(`Unable to allocate a unique slug for "${base}".`);
}
