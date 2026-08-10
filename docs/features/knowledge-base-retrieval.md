# Knowledge Base Retrieval

Agents with assigned knowledge bases can search indexed document chunks at chat time through the built-in `search_knowledge_base` tool. Retrieval uses the same Pinecone integrated index created during ingestion (`multilingual-e5-large`, namespace = workspace UUID).

## Overview

```
Agent assigned KBs
  → resolveWorkspaceAgentRuntime loads knowledgeBaseIds
  → system prompt instructs agent to call search_knowledge_base
  → agent invokes tool when needed
  → Pinecone searchRecords + rerank
  → tool returns JSON excerpts
  → agent answers (with or without inline citations)
```

This is **tool-based retrieval**, not auto-retrieve middleware. The agent decides when to search; the system prompt encourages tool use for factual/documented questions.

## Tool: `search_knowledge_base`

Auto-injected when an agent has at least one assigned knowledge base. Not stored in the workspace tools registry.

### Input

| Field | Type | Default | Purpose |
| ----- | ---- | ------- | ------- |
| `query` | string | required | Semantic search query |
| `rewriteQuery` | boolean | `false` | Rewrite the query with Haiku for clearer semantic matching |
| `multiQuery` | boolean | `false` | Generate multiple query variants and merge results |

### Output (JSON string)

```json
{
  "results": [
    {
      "text": "Check-in starts at 2 PM.",
      "source": "sop-checkin.pdf > Check-in",
      "filename": "sop-checkin.pdf",
      "sectionTitle": "Check-in",
      "score": 0.91
    }
  ],
  "queriesUsed": ["check-in time"],
  "strategiesUsed": {
    "rewriteQuery": false,
    "multiQuery": false
  }
}
```

On failure, the tool returns `{ "error": "..." }` so the agent can continue without crashing the run.

## Advanced query strategies

Both flags are optional and controlled by the **agent at tool call time** (not env toggles).

### `rewriteQuery: true`

Service: `lib/knowledge-base/services/rewrite-knowledge-base-search-query.ts`

- Uses `KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL` (defaults to `KNOWLEDGE_BASE_CLASSIFIER_MODEL` / Haiku)
- Rewrites conversational or vague queries into clearer semantic search text
- Useful for: pronouns, implicit context, short questions

### `multiQuery: true`

Service: `lib/knowledge-base/services/generate-knowledge-base-search-queries.ts`

- Generates up to 2 additional query variants plus the base query
- Runs one Pinecone search per query in parallel
- Merges hits by record ID, keeps highest score, returns top 8 overall
- Useful for: broad topics, multi-part questions, ambiguous wording

When both flags are enabled, rewrite runs first, then multi-query expansion uses the rewritten text.

## Pinecone search settings

| Setting | Value |
| ------- | ----- |
| Namespace | `{workspaceId}` |
| Filter | `knowledgeBaseId: { $in: assignedKbIds }` |
| Initial fetch | `topK: 20` |
| Rerank model | `bge-reranker-v2-m3` |
| Final results | `topN: 8` |
| Embed field | `chunk_text` |

Service: `lib/knowledge-base/services/search-knowledge-base-chunks.ts`

Requires `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`. If Pinecone is not configured, the tool returns an error JSON payload.

## System prompt guidance

When an agent has assigned KBs, `resolveWorkspaceAgentRuntime` appends a **Knowledge bases** section via `buildChatAgentKnowledgePrompt`:

- Instructs the agent to call `search_knowledge_base` before answering documented questions
- Explains when to use `rewriteQuery` and `multiQuery`
- Applies citation rules based on runtime config

Chat agent (dashboard): `citationsEnabled: true` → inline citations `[filename > section]`

Channel agent (WhatsApp, etc.): `citationsEnabled: false` → no citation markers in replies

## Runtime wiring

| Component | Role |
| --------- | ---- |
| `list-agent-knowledge-base-ids.ts` | Load assigned KB IDs for an agent |
| `resolve-workspace-agent-runtime.ts` | Merge skills prompt + KB prompt + tool/KB IDs |
| `build-chat-agent-knowledge-tool.ts` | LangChain tool wrapper |
| `create-chat-agent.ts` | Append KB tool to workspace tools |
| `create-chat-agent.ts` | Shared tool wiring for web and channel envs |
| `build-workspace-agent-cache-key.ts` | Cache invalidates on KB assignment or citation mode |

Agent cache key includes `knowledgeBaseIds` and `citationsEnabled` so assignment changes rebuild the agent instance.

## Environment variables

```env
PINECONE_API_KEY=
PINECONE_INDEX_NAME=bnb-kb-multilingual-e5
KNOWLEDGE_BASE_QUERY_STRATEGY_MODEL=claude-haiku-4-5   # optional
KNOWLEDGE_BASE_CLASSIFIER_MODEL=claude-haiku-4-5       # fallback for query strategy
ANTHROPIC_API_KEY=                                       # required for rewrite/multi-query
```

## Code map

| Area | Location |
| ---- | -------- |
| Search constants | `lib/knowledge-base/constants.ts` |
| Tool input schema | `lib/knowledge-base/schema.ts` |
| Search types | `lib/knowledge-base/types.ts` |
| List assigned KB IDs | `lib/knowledge-base/services/list-agent-knowledge-base-ids.ts` |
| Pinecone search | `lib/knowledge-base/services/search-knowledge-base-chunks.ts` |
| Query rewrite | `lib/knowledge-base/services/rewrite-knowledge-base-search-query.ts` |
| Multi-query | `lib/knowledge-base/services/generate-knowledge-base-search-queries.ts` |
| Merge hits | `lib/knowledge-base/utils/merge-knowledge-base-search-hits.ts` |
| Tool result formatting | `lib/knowledge-base/utils/format-knowledge-base-search-tool-result.ts` |
| System prompt block | `lib/chat-agent/knowledge/build-chat-agent-knowledge-prompt.ts` |
| LangChain tool | `lib/chat-agent/tools/build-chat-agent-knowledge-tool.ts` |

Related ingestion docs: [`knowledge-base-ingestion.md`](./knowledge-base-ingestion.md)

## Manual test checklist

1. Assign a KB with at least one `ready` document to an agent.
2. Open dashboard chat and ask a question answered only in that document.
3. Confirm the agent calls `search_knowledge_base` and cites inline `[filename > section]`.
4. Ask a vague question; confirm a retry with `rewriteQuery: true` or `multiQuery: true` improves results.
5. Test the same agent on a channel connection; confirm answers have no citation markers.
6. Remove the KB assignment; confirm the tool disappears and cache rebuilds.

## Not implemented yet

- Source footnotes or citation UI in the chat message component (inline text only)
- Per-agent citation toggle in dashboard settings (hard-coded: chat on, channel off)
- Search analytics / logging dashboard
- Public HTTP API for KB search outside agent runs
