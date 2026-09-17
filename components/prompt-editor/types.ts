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
};
