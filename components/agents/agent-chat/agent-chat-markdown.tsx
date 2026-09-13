"use client";

import React, { type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ChartRenderer, parseChartSpec } from "@/components/ui/chart-renderer";
import { cn } from "@/lib/utils";

type AgentChatMarkdownProps = {
  content: string;
  className?: string;
};

/**
 * Override <pre> so that ```chart blocks are rendered without any <pre> wrapper.
 * ReactMarkdown always emits <pre><code class="language-xxx">…</code></pre> for
 * fenced code blocks, so we must intercept at the <pre> level to avoid the
 * monospace / white-space:pre styles leaking into the chart container.
 */
function Pre({ children }: ComponentPropsWithoutRef<"pre">) {
  const child = React.Children.toArray(children)[0];
  if (React.isValidElement(child)) {
    const props = child.props as { className?: string; children?: string };
    const language = /language-(\w+)/.exec(props.className ?? "")?.[1];
    if (language === "chart" && typeof props.children === "string") {
      const spec = parseChartSpec(props.children);
      if (spec) {
        return <ChartRenderer spec={spec} />;
      }
    }
  }
  return <pre>{children}</pre>;
}

export function AgentChatMarkdown({
  content,
  className,
}: AgentChatMarkdownProps) {
  return (
    <div className={cn("typeset typeset-chat", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="typeset-scroll">
              <table>{children}</table>
            </div>
          ),
          pre: Pre,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
