"use client";

import { SparklesIcon, WrenchIcon } from "lucide-react";

import type { MentionItem } from "./types";

type PromptEditorMentionTagsProps = {
  items: MentionItem[];
  label: string;
  disabled?: boolean;
  onItemClick: (item: MentionItem) => void;
};

function MentionItemTag({
  item,
  disabled,
  onClick,
}: {
  item: MentionItem;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = item.type === "tool" ? WrenchIcon : SparklesIcon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
      <span>{item.name}</span>
    </button>
  );
}

export function PromptEditorMentionTags({
  items,
  label,
  disabled,
  onItemClick,
}: PromptEditorMentionTagsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <MentionItemTag
          key={`${item.type}-${item.id}`}
          item={item}
          disabled={disabled}
          onClick={() => onItemClick(item)}
        />
      ))}
      </div>
    </div>
  );
}
