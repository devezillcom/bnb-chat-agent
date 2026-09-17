"use client";

import type { Editor } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { createMentionExtension } from "./create-mention-extension";
import {
  getPromptMarkdown,
  parsePromptMarkdown,
  setPromptContent,
} from "./prompt-content";
import type { MentionItem, PromptEditorProps } from "./types";

const EMPTY_ITEMS: MentionItem[] = [];

export function PromptEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  ariaLabel,
  disabled = false,
  className,
  minHeightClassName = "min-h-16",
  ariaInvalid,
  items = EMPTY_ITEMS,
}: PromptEditorProps) {
  // Created once and never mutated; the mention extension itself reads its
  // live items from `editor.storage.mention` (synced below), so it never
  // needs to be recreated when the `items` prop changes.
  const [mentionExtension] = useState(() => createMentionExtension());
  const editorRef = useRef<Editor | null>(null);
  const lastEmittedValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, markdownLinks: true },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      mentionExtension,
      Markdown,
    ],
    content: "",
    editable: !disabled,
    immediatelyRender: false,
    onCreate({ editor: currentEditor }) {
      editorRef.current = currentEditor;
      currentEditor.commands.setMentionItems(items);
      setPromptContent(currentEditor, value, items);
      lastEmittedValue.current = value;
    },
    onUpdate({ editor: currentEditor }) {
      const markdown = getPromptMarkdown(currentEditor);
      lastEmittedValue.current = markdown;
      onChange(markdown);
    },
    onBlur() {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        spellcheck: "false",
      },
      handlePaste(_view, event) {
        const currentEditor = editorRef.current;
        if (!currentEditor) return false;

        const clipboard = event.clipboardData;
        if (!clipboard) return false;
        if (clipboard.getData("text/html")) return false;

        const text = clipboard.getData("text/plain");
        if (!text) return false;

        const mentionItems = (currentEditor.storage.mention?.items ??
          []) as MentionItem[];
        const parsed = parsePromptMarkdown(currentEditor, text, mentionItems);
        currentEditor.commands.insertContent(parsed.content ?? parsed);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    editor?.commands.setMentionItems(items);
  }, [editor, items]);

  // Keep the editor in sync when `value` changes from outside (form reset,
  // Improve with AI, etc). Skipped when the change originated from this
  // editor's own `onUpdate`. Must run before `setEditable` so toggling
  // disabled (the Improve with AI spinner) cannot emit `onUpdate` with the
  // previous document and overwrite the incoming value.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedValue.current) return;

    setPromptContent(editor, value, items);
    lastEmittedValue.current = value;
  }, [editor, items, value]);

  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);

  return (
    <div
      aria-invalid={ariaInvalid ? "true" : undefined}
      className={cn(
        "prompt-editor typeset typeset-compact w-full rounded-lg border border-input bg-transparent px-6 py-5 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "[&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none",
        "md:text-sm",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        minHeightClassName,
        className,
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
