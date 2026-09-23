import type { ReactNode } from "react";

import type { AgentMentionItem } from "@/lib/agents/types";

export type MentionItem = AgentMentionItem;

export type PromptEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  minHeightClassName?: string;
  ariaInvalid?: boolean;
  items?: MentionItem[];
  /** Label shown above the editor when mention items are available. */
  mentionTagsLabel?: string;
  /** Hint shown below the editor. */
  mentionHint?: string;
  /** Actions rendered at the top-right of the editor on hover. */
  editorActions?: ReactNode;
  /** Inline bubble action shown when the user selects text. */
  selectionImprove?: {
    label: string;
    improvingLabel: string;
    onImprove: (selectedMarkdown: string) => Promise<string | null>;
  };
};
