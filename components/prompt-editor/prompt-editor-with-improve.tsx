"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PromptEditor } from "./prompt-editor";
import type { PromptEditorProps } from "./types";

export type PromptImproveRequest = {
  selectedText?: string;
};

export type PromptEditorWithImproveProps = Omit<
  PromptEditorProps,
  "editorActions" | "selectionImprove"
> & {
  improveLabel: string;
  improvingLabel: string;
  onImprove: (request?: PromptImproveRequest) => Promise<string | null>;
};

export function PromptEditorWithImprove({
  improveLabel,
  improvingLabel,
  onImprove,
  disabled = false,
  onChange,
  ...editorProps
}: PromptEditorWithImproveProps) {
  const [isImproving, setIsImproving] = useState(false);
  const isDisabled = disabled || isImproving;

  async function handleImprove(selectedText?: string) {
    setIsImproving(true);
    try {
      const improved = await onImprove(
        selectedText ? { selectedText } : undefined,
      );
      if (improved && !selectedText) {
        onChange(improved);
      }
      return improved;
    } finally {
      setIsImproving(false);
    }
  }

  return (
    <PromptEditor
      {...editorProps}
      disabled={isDisabled}
      onChange={onChange}
      editorActions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isDisabled}
          onClick={() => {
            void handleImprove();
          }}
          className={cn(
            "pointer-events-auto sticky top-2 shadow-sm transition-opacity",
            "opacity-0 group-hover/prompt-editor:opacity-100 group-focus-within/prompt-editor:opacity-100 focus-visible:opacity-100",
            isImproving && "opacity-100",
          )}
        >
          {isImproving ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
          ) : (
            <SparklesIcon data-icon="inline-start" />
          )}
          {isImproving ? improvingLabel : improveLabel}
        </Button>
      }
      selectionImprove={{
        label: improveLabel,
        improvingLabel,
        onImprove: (selectedMarkdown) => handleImprove(selectedMarkdown),
      }}
    />
  );
}
