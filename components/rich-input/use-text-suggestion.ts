"use client";

import { useMemo } from "react";

export function useTextSuggestion(
  searchWord: string,
  suggestions: string[] = [],
) {
  const fullText = useMemo(() => {
    if (!searchWord.trim()) return "";

    const normalizedSearch = searchWord.toLowerCase().trim();

    return (
      suggestions.find((suggestion) =>
        suggestion.toLowerCase().startsWith(normalizedSearch),
      ) ?? ""
    );
  }, [searchWord, suggestions]);

  const textSuggestion = useMemo(
    () => (fullText ? fullText.slice(searchWord.length) : ""),
    [fullText, searchWord],
  );

  return { textSuggestion, fullText };
}
