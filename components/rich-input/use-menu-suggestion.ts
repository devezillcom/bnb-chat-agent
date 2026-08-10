"use client";

import { useMemo } from "react";

import type { SuggestionMenuItem } from "./types";

export function useMenuSuggestion(
  searchWord = "",
  menuItems: SuggestionMenuItem[] = [],
  menuTrigger = "@",
) {
  const items = useMemo(() => {
    if (!searchWord.trim() || !searchWord.includes(menuTrigger)) return [];

    const normalizedSearch = searchWord.toLowerCase();

    return menuItems.filter((item) => {
      const normalizedName = item.name.toLowerCase();
      const normalizedDescription = item.description?.toLowerCase();

      if (normalizedSearch === normalizedName) return false;
      if (normalizedSearch === menuTrigger) return true;

      return (
        normalizedName.startsWith(normalizedSearch) ||
        normalizedDescription?.includes(normalizedSearch.slice(1))
      );
    });
  }, [menuItems, menuTrigger, searchWord]);

  return { items };
}
