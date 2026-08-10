"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";

import { cn } from "@/lib/utils";

import { useControllableState } from "./use-controllable-state";
import { useMenuSuggestion } from "./use-menu-suggestion";
import { useTextSuggestion } from "./use-text-suggestion";
import type { RichInputFieldElement, RichInputProps } from "./types";

const fieldBaseClassName =
  "w-full bg-transparent px-3 text-sm font-normal text-foreground outline-none";

const variantClassNames = {
  input:
    "py-1 leading-normal whitespace-nowrap overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
  textarea:
    "min-h-12 max-h-48 resize-none py-2 leading-relaxed whitespace-pre-wrap wrap-break-word field-sizing-content overflow-y-auto",
} as const;

export function RichInput({
  id,
  onChange,
  value: valueProp,
  defaultValue,
  placeholder,
  ariaLabel,
  className,
  containerClassName,
  disabled = false,
  variant = "textarea",
  onSubmit,
  clearOnSubmit = true,
  textSuggestions = [],
  menuItems = [],
  menuTrigger = "@",
  name,
  onBlur,
}: RichInputProps) {
  const isInputVariant = variant === "input";
  const fieldRef = useRef<RichInputFieldElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  });
  const [searchWord, setSearchWord] = useState("");
  const [isCursorAtLineEnd, setIsCursorAtLineEnd] = useState(false);
  const [isMenuDismissed, setIsMenuDismissed] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);
  const fieldPrevious = useRef({ value: "", cursorPosition: 0 });
  const { textSuggestion, fullText } = useTextSuggestion(
    isCursorAtLineEnd ? searchWord : "",
    textSuggestions,
  );
  const { items: menuSuggestionItems } = useMenuSuggestion(
    searchWord,
    menuItems,
    menuTrigger,
  );
  const showMenu = menuSuggestionItems.length > 0 && !isMenuDismissed;
  const selectedMenuItem = menuSuggestionItems[selectedMenuIndex];

  const updateSearchWord = useCallback(
    (target?: RichInputFieldElement | null) => {
      const field = target ?? fieldRef.current;
      if (!field) return;

      const current = {
        value: field.value,
        cursorPosition: field.selectionStart ?? field.value.length,
      };

      if (
        current.value === fieldPrevious.current.value &&
        current.cursorPosition === fieldPrevious.current.cursorPosition
      ) {
        return;
      }

      fieldPrevious.current = current;
      setSearchWord(getCurrentWord(field).word);
      setIsCursorAtLineEnd(isCursorAtEndOfLine(field));
      setIsMenuDismissed(false);
      setSelectedMenuIndex(0);
    },
    [],
  );

  const applySuggestion = useCallback(
    (suggestion?: string) => {
      const field = fieldRef.current;
      const replacement =
        suggestion || fullText || selectedMenuItem?.name || "";
      if (!field || !replacement) return;

      const { word, position } = getCurrentWord(field);
      const nextValue = `${field.value.slice(0, position)}${replacement}${field.value.slice(
        position + word.length,
      )}`;
      const cursorPosition = position + replacement.length;

      setValue(nextValue);
      setSearchWord("");
      setIsMenuDismissed(true);

      requestAnimationFrame(() => {
        field.selectionStart = cursorPosition;
        field.selectionEnd = cursorPosition;
      });
    },
    [fullText, selectedMenuItem?.name, setValue],
  );

  function handleChange(event: ChangeEvent<RichInputFieldElement>) {
    const nextValue = isInputVariant
      ? event.target.value.replace(/\n/g, "")
      : event.target.value;

    setValue(nextValue);
    updateSearchWord(event.target);
  }

  function handleKeyDown(event: KeyboardEvent<RichInputFieldElement>) {
    if (event.key === "ArrowDown" && showMenu) {
      event.preventDefault();
      setSelectedMenuIndex((current) =>
        Math.min(current + 1, menuSuggestionItems.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp" && showMenu) {
      event.preventDefault();
      setSelectedMenuIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && showMenu) {
      event.preventDefault();
      applySuggestion();
      return;
    }

    if (event.key === "Enter" && (isInputVariant || !event.shiftKey)) {
      const message = event.currentTarget.value.trim();

      if (onSubmit) {
        event.preventDefault();
        onSubmit(message);
        if (clearOnSubmit) setValue("");
      }
      return;
    }

    if (
      event.key === "Tab" &&
      (textSuggestion || showMenu)
    ) {
      event.preventDefault();
      applySuggestion();
      return;
    }

    if (event.key === "Escape") {
      setIsMenuDismissed(true);
    }
  }

  function handleSearchWordUpdate(event: SyntheticEvent<RichInputFieldElement>) {
    updateSearchWord(event.currentTarget);
  }

  function handleScroll(event: SyntheticEvent<RichInputFieldElement>) {
    if (!overlayRef.current) return;

    overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
  }

  const fieldClassName = cn(
    fieldBaseClassName,
    variantClassNames[variant],
    className,
  );
  const sharedProps = {
    id,
    name,
    className: fieldClassName,
    placeholder,
    "aria-label": ariaLabel,
    value,
    disabled,
    onChange: handleChange,
    onBlur,
    onFocus: handleSearchWordUpdate,
    onKeyDown: handleKeyDown,
    onKeyUp: handleSearchWordUpdate,
    onClick: handleSearchWordUpdate,
    onScroll: handleScroll,
    spellCheck: false,
  };

  return (
    <div className="relative w-full">
      {showMenu ? (
        <div className="absolute bottom-full z-10 mb-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          {menuSuggestionItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-accent",
                selectedMenuIndex === index && "bg-accent",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applySuggestion(item.name)}
            >
              <span className="truncate text-xs font-medium">{item.name}</span>
              {item.description ? (
                <span className="truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "relative rounded-xl border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50",
          containerClassName,
        )}
      >
        {isInputVariant ? (
          <input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            type="text"
            {...sharedProps}
          />
        ) : (
          <textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            {...sharedProps}
          />
        )}
        <div
          ref={overlayRef}
          aria-hidden="true"
          className={cn(
            fieldClassName,
            "pointer-events-none absolute inset-0 text-transparent",
            isInputVariant ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {value}
          {textSuggestion ? (
            <span className="text-muted-foreground">{textSuggestion}</span>
          ) : null}
          {"\u200B"}
        </div>
      </div>
    </div>
  );
}

function isCursorAtEndOfLine(field: RichInputFieldElement | null) {
  if (!field) return false;

  return (field.selectionStart ?? field.value.length) === field.value.length;
}

function getCurrentWord(field: RichInputFieldElement) {
  const cursorPosition = field.selectionStart ?? field.value.length;
  const textBeforeCursor = field.value.slice(0, cursorPosition);
  const textAfterCursor = field.value.slice(cursorPosition);
  const beforeMatch = textBeforeCursor.match(/([^\s]+)$/)?.[1] ?? "";
  const afterMatch = textAfterCursor.match(/^([^\s]+)/)?.[1] ?? "";

  return {
    word: beforeMatch + afterMatch,
    position: cursorPosition - beforeMatch.length,
  };
}
