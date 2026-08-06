"use client";

import {
  ArrowUpIcon,
  FolderOpenIcon,
  GlobeIcon,
  MessageCircleIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";

import { AssistantGrid } from "@/components/dashboard/assistant-grid";
import { WorkspaceSwitcherCompact } from "@/components/dashboard/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  PLACEHOLDER_TOOL_CHIPS,
} from "@/lib/dashboard/placeholder-data";
import { cn } from "@/lib/utils";

export function DashboardHome() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-1">
          <WorkspaceSwitcherCompact />
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hi, what&apos;s your plan for today?
          </h1>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
          <SparklesIcon className="size-4 text-muted-foreground" />
          <span className="hidden sm:inline">Skills market</span>
          <Switch defaultChecked aria-label="Toggle skills market" />
        </label>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-8 md:px-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {PLACEHOLDER_TOOL_CHIPS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium shadow-sm transition hover:opacity-90",
                tool.color,
              )}
            >
              <span className="size-2 rounded-full bg-white/80" />
              {tool.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-3 shadow-sm ring-1 ring-foreground/5">
          <textarea
            rows={4}
            placeholder="Send a message, upload files, or create a scheduled task..."
            className="min-h-28 w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" size="icon-sm" aria-label="Add attachment">
                <PlusIcon />
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                <FolderOpenIcon />
                Work in a folder
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                Claude Sonnet 4
              </Button>
            </div>
            <Button size="icon" className="rounded-full" aria-label="Send message">
              <ArrowUpIcon />
            </Button>
          </div>
        </div>

        <AssistantGrid />

        <div className="mt-auto flex justify-center pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-sm">
            <Button variant="ghost" size="icon-sm" aria-label="Chat">
              <MessageCircleIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Favorites">
              <StarIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Web search">
              <GlobeIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
