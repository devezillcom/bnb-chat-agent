"use client";

import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react/menus";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import {
  getSelectionMarkdown,
  replaceSelectionWithMarkdown,
} from "./prompt-content";
import type { MentionItem } from "./types";

const MIN_SELECTION_LENGTH = 3;

type PromptEditorSelectionBubbleProps = {
  editor: Editor | null;
  disabled?: boolean;
  items: MentionItem[];
  improve: {
    label: string;
    improvingLabel: string;
    onImprove: (selectedMarkdown: string) => Promise<string | null>;
  };
};

export function PromptEditorSelectionBubble({
  editor,
  disabled = false,
  items,
  improve,
}: PromptEditorSelectionBubbleProps) {
  const [isImproving, setIsImproving] = useState(false);

  async function handleImprove() {
    if (!editor || disabled || isImproving) return;

    const { from, to } = editor.state.selection;
    const selectedMarkdown = getSelectionMarkdown(editor);
    if (!selectedMarkdown || selectedMarkdown.length < MIN_SELECTION_LENGTH) {
      return;
    }

    setIsImproving(true);
    try {
      const improved = await improve.onImprove(selectedMarkdown);
      if (improved) {
        replaceSelectionWithMarkdown(editor, { from, to }, improved, items);
      }
    } finally {
      setIsImproving(false);
    }
  }

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: currentEditor, from, to }) => {
        if (disabled || isImproving) return false;
        if (from === to) return false;

        const selectedMarkdown = getSelectionMarkdown(currentEditor);
        return (
          !!selectedMarkdown && selectedMarkdown.length >= MIN_SELECTION_LENGTH
        );
      }}
      options={{ placement: "top", offset: 8 }}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled || isImproving}
        onClick={handleImprove}
        className="shadow-md"
      >
        {isImproving ? (
          <Loader2Icon className="animate-spin" data-icon="inline-start" />
        ) : (
          <SparklesIcon data-icon="inline-start" />
        )}
        {isImproving ? improve.improvingLabel : improve.label}
      </Button>
    </BubbleMenu>
  );
}
