# Knowledge Base Ingestion

Upload documents into workspace knowledge bases, convert them to Markdown, chunk them for retrieval, and index vectors in Pinecone. Each knowledge base is a **collection**; agents will link to KBs later via the agent service (not from the KB module).

## Overview

End-to-end flow:

```
Create KB → Upload file to R2 → Confirm document → QStash job
  → convert markdown → detect language → classify chunk strategy
  → chunk → Pinecone upsertRecords → ready
```

The UI shows realtime progress via Firebase RTDB job tracking. Full intermediate results are stored on R2 for debugging.

## Data model

### `knowledge_bases`

Workspace-scoped collection (name, slug, description).

### `knowledge_base_documents`

One row per uploaded file. Tracks pipeline `status`, chunk metadata, R2 artifact keys, and Pinecone index stats.

### `agent_knowledge_bases`

Junction table linking agents to knowledge bases. **Assignment is owned by the agent service** (agent adds/removes KBs). The knowledge-base module does not expose assign APIs.

See [`.ai/database-schema.md`](../../.ai/database-schema.md) for full column definitions.

## Upload flow

1. **Presigned URL** — `POST /api/knowledge-bases/:kbId/documents/upload-url`
   - Validates MIME type and size (max **50 MB**).
   - R2 prefix: `kb/{workspaceId}/{kbId}/uploads/`.

2. **Client PUT** — Browser uploads directly to R2 using the signed URL.

3. **Confirm** — `POST /api/knowledge-bases/:kbId/documents`
   - Body: `{ key, filename, contentType, contentLength }`.
   - Validates the R2 key belongs to the KB upload prefix.
   - Inserts `knowledge_base_documents` with `status: uploaded`.
   - Upserts RTDB job `kb-doc-{documentId}`.
   - Enqueues QStash job `knowledge-base-document-process`.

## Background pipeline (QStash)

Job handler: `lib/knowledge-base/services/handle-knowledge-base-document-process-qstash-job.ts`

Orchestrator: `lib/knowledge-base/services/process-knowledge-base-document.ts`

| Stage | DB status | What happens |
| ----- | --------- | ------------ |
| Fetch source | `converting` | Read file from R2 (`source_r2_key`) |
| Convert | `converting` | Document → Markdown (see providers below) |
| Detect + classify | `classifying` | Language heuristic; chunk strategy (heuristic → Haiku fallback) |
| Chunk | `chunking` | Split markdown using selected strategy |
| Index | `indexing` | Batch upsert to Pinecone (`upsertRecords`, 96 records/batch) |
| Done | `ready` | Persist artifact keys and stats |
| Error | `failed` | `error_message` + partial `pipeline-log.json` on R2 |

Flow control: one concurrent job per document (`kb-doc-{documentId}`).

## Markdown conversion

Provider router: `lib/knowledge-base/providers/convert-document-to-markdown.ts`

| Input | Provider | Notes |
| ----- | -------- | ----- |
| `.md`, `.txt` | `plain-text` | Read UTF-8 directly; skip anydoc |
| Office formats (DOCX, XLSX, PPTX, ODT, …) | `anydoc` | Local `@firecrawl/anydoc` |
| PDF | `firecrawl-parse` | Firecrawl `/v2/parse`, `parsers: [{ type: "pdf", mode: "auto" }]` — text-first, OCR fallback for scanned pages |
| anydoc failure | `firecrawl-parse` | Fallback when anydoc returns `unsupported`, `encrypted`, `malformed`, or `missingPart` |

OCR is swappable: implement `MarkdownConverterProvider` / `OcrMarkdownProvider` in `lib/knowledge-base/providers/` and extend the router.

## Language detection

Heuristic on markdown sample (`lib/knowledge-base/utils/detect-document-language.ts`):

- `vi` — Vietnamese diacritics and common words
- `en` — ASCII-heavy content
- `mixed` — both signals strong
- `unknown` — insufficient signal

Stored on `knowledge_base_documents.detected_language`. Used for chunk strategy (e.g. Vietnamese contract patterns) and Pinecone metadata. **One multilingual Pinecone index** handles all languages; no per-language indexes.

## Chunk classification

`lib/knowledge-base/utils/classify-chunk-strategy.ts`

1. **Heuristic** — filename, MIME, markdown structure (confidence ≥ 0.72 → use without LLM).
2. **Haiku fallback** — `KNOWLEDGE_BASE_CLASSIFIER_MODEL` (default `claude-haiku-4-5`) when heuristic is uncertain.

### Chunk strategies

| Strategy | Typical use |
| -------- | ----------- |
| `chunk_markdown_by_heading` | Guides, SOPs, structured docs |
| `chunk_contract_by_article` | Contracts — `Điều X`, `Khoản X`, `Article X` |
| `chunk_tabular_data` | CSV, Excel tables |
| `chunk_slide_by_slide` | Presentations |
| `chunk_qa_pairs` | FAQ-style Q&A |
| `chunk_recursive_by_token` | Fallback (900 characters, 120-character overlap) |

Implementation: `lib/knowledge-base/utils/chunk-document.ts`

All semantic strategies retain their structural context (heading, article, slide, or
question) in the embedded text. Long logical sections are then split into
character-bounded chunks with overlap, preserving that context and part provenance
on every derived chunk. The strategy name `chunk_recursive_by_token` is retained
for backwards compatibility, but the current LangChain splitter measures
characters rather than model tokens.

## Pinecone indexing

- **Model:** `multilingual-e5-large` (integrated embedding via `upsertRecords`)
- **Field:** `chunk_text`
- **Namespace:** `{workspaceId}` (one namespace per workspace)
- **Record ID:** `{documentId}:{chunkIndex}` (idempotent re-index). Oversized logical chunks are split before upsert; Pinecone may have more vectors than `chunks.json`.
- **Batch size:** 96 records per `upsertRecords` call
- **Text size limit:** Pinecone metadata cap is **40 KB per vector** (includes `chunk_text`). Chunks larger than the ~38 KB UTF-8 safety budget are split at index time. The final guard accounts for the chunk text plus its chunk metadata and rejects a record that cannot fit; full logical chunks remain in `chunks.json` on R2.
- **Region:** `ap-southeast-1` (AWS Singapore) by default — nearest to Vietnam. Override with `PINECONE_REGION`.

Metadata on each record: `workspaceId`, `knowledgeBaseId`, `documentId`, `chunkIndex`, `chunkStrategy`, `detectedLanguage`, `filename`, `headingPath`, `sectionTitle`, `sourceChunkIndex`, `partIndex`, `partCount`.

Setup index (once per environment):

```bash
npm run kb:setup-index -- --dry-run
npm run kb:setup-index -- --yes
```

Service: `lib/knowledge-base/services/index-knowledge-base-chunks.ts`

## R2 artifacts

After processing, artifacts live under:

```
kb/{workspaceId}/{kbId}/{documentId}/
  markdown.md
  chunks.json
  index-result.json
  pipeline-log.json
```

Source upload stays at:

```
kb/{workspaceId}/{kbId}/uploads/{uuid}.{ext}
```

Postgres stores R2 keys and summary stats only — not full markdown/chunk bodies.

### Pipeline log shape

`pipeline-log.json` lists stages with timestamps:

```json
{
  "stages": [
    {
      "name": "convert_markdown",
      "status": "succeeded",
      "startedAt": "…",
      "finishedAt": "…",
      "details": { "providerId": "anydoc", "charCount": 12345 }
    }
  ]
}
```

Use this to verify conversion quality, chunk counts, and index batches without querying Pinecone.

## Job status tracking (RTDB)

- **Path:** `jobs/kb-doc-{documentId}`
- **Create/upsert:** `upsertJobStatusTracking` when document is confirmed
- **Updates:** each pipeline stage via `updateJobStatusTracking`
- **Frontend:** `hooks/use-job-status-tracking.ts` (SSR-safe `useSyncExternalStore`)

Payload includes `stage`, `status`, `chunkCount`, `pineconeRecordCount`, and `error` on failure.

## API routes

| Method | Route | Purpose |
| ------ | ----- | ------- |
| GET/POST | `/api/knowledge-bases` | List / create KB |
| GET | `/api/knowledge-bases/:kbId` | KB detail |
| GET/POST | `/api/knowledge-bases/:kbId/documents` | List / confirm upload |
| POST | `/api/knowledge-bases/:kbId/documents/upload-url` | Presigned upload URL |
| DELETE | `/api/knowledge-bases/:kbId/documents/:docId` | Delete document + Pinecone vectors |

## UI

| Page | Path | Behavior |
| ---- | ---- | -------- |
| List + create dialog | `/w/[i]/knowledge-base` | Name, description; search/sort |
| Detail + upload | `/w/[i]/knowledge-base/[kbId]` | Multi-file upload, status badges, RTDB progress |

Agent ↔ KB assignment UI is **not implemented** yet.

## Environment variables

```env
PINECONE_API_KEY=
PINECONE_INDEX_NAME=bnb-kb-multilingual-e5
PINECONE_REGION=ap-southeast-1   # optional override
FIRECRAWL_API_KEY=
KNOWLEDGE_BASE_CLASSIFIER_MODEL=claude-haiku-4-5   # optional
```

Also required for the full flow: R2, QStash, Firebase RTDB (job UI), `ANTHROPIC_API_KEY` (Haiku classifier fallback).

## Code map

| Area | Location |
| ---- | -------- |
| Constants / statuses | `lib/knowledge-base/constants.ts` |
| Schemas | `lib/knowledge-base/schema.ts` |
| Markdown providers | `lib/knowledge-base/providers/` |
| Chunk + classify utils | `lib/knowledge-base/utils/` |
| Pipeline orchestrator | `lib/knowledge-base/services/process-knowledge-base-document.ts` |
| QStash handler | `lib/knowledge-base/services/handle-knowledge-base-document-process-qstash-job.ts` |
| Pinecone client | `lib/pinecone/utils/get-pinecone-client.ts` |
| Index setup script | `scripts/setup-kb-pinecone-index.ts` |
| QStash registry | `lib/qstash/job-config.ts` → `knowledge-base-document-process` |
| List UI | `components/knowledge-base/knowledge-bases-list-page.tsx` |
| Detail UI | `components/knowledge-base/knowledge-base-detail-page.tsx` |

## Delete document

`DELETE …/documents/:docId`:

1. Load `index-result.json` from R2 (if present) and delete Pinecone vectors by stored record IDs.
2. Delete all R2 objects for the document: source upload, markdown, chunks, index result, and pipeline log.
3. Delete the DB row.

If R2 deletion fails, the API returns an error and the DB row is kept.

## Not implemented yet

- **Re-process** — no public re-index endpoint (re-upload or add later).

Retrieval at chat time is documented in [`knowledge-base-retrieval.md`](./knowledge-base-retrieval.md).

## Local testing checklist

1. Run migrations for `knowledge_bases`, `knowledge_base_documents`, `agent_knowledge_bases`.
2. `npm run kb:setup-index -- --yes`
3. Set `PINECONE_API_KEY`, `FIRECRAWL_API_KEY`, R2, QStash, Firebase RTDB env vars.
4. Create a KB in the dashboard → upload a PDF and a `.md` file.
5. Watch status reach `ready`; inspect `pipeline-log.json` on R2.
6. Confirm vectors in Pinecone namespace = workspace UUID.
