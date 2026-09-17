"use client";

import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { SparklesIcon, WrenchIcon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { cn } from "@/lib/utils";

import type { MentionItem } from "./types";

export type MentionListRef = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type MentionListProps = SuggestionProps<MentionItem>;

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    function selectItem(index: number) {
      const item = items[index];
      if (!item) return;

      command({ id: item.id, label: item.name, mentionType: item.type });
    }

    useImperativeHandle(ref, () => ({
      onKeyDown({ event }) {
        if (items.length === 0) return false;

        if (event.key === "ArrowDown") {
          setSelectedIndex((current) => (current + 1) % items.length);
          return true;
        }

        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (current) => (current - 1 + items.length) % items.length,
          );
          return true;
        }

        if (event.key === "Enter" || event.key === "Tab") {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return null;
    }

    return (
      <div className="not-typeset max-h-60 w-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent",
              index === selectedIndex && "bg-accent",
            )}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectItem(index)}
          >
            {item.type === "tool" ? (
              <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <SparklesIcon className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{item.name}</span>
          </button>
        ))}
      </div>
    );
  },
);
