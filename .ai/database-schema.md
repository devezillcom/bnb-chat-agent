# Database Schema — BNB Chat Agent

Source: `db/schema.ts` (Drizzle ORM)

---

## Enums

### `workspace_permission`

Used by `workspace_members.permission`.

| Value | Description |
| ----- | ----------- |
| `read` | View-only |
| `edit` | Can modify |
| `owner` | Full control |

---

## Tables

### `users`

App user identity, linked to Firebase Auth.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| firebase_uid | text | NO | — | Firebase Auth UID |
| email | text | NO | — | Login / contact email |
| display_name | text | YES | — | Human-readable name |
| avatar_url | text | YES | — | Profile image URL |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `firebase_uid` — UNIQUE
- `users_email_idx` — UNIQUE on `email`

**Relations**

- → `workspaces.owner_user_id`
- → `workspace_members.user_id`
- → `workspace_members.granted_by`
- → `chat_agent_sessions.user_id`

---

### `workspaces`

Tenant container for members and chat sessions.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| name | text | NO | — | Display name |
| slug | text | YES | — | URL-safe unique identifier |
| owner_user_id | uuid | NO | — | Owning user (`users.id`) |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `workspaces_slug_idx` — UNIQUE on `slug`
- `workspaces_owner_user_id_idx` — on `owner_user_id`

**Relations**

- `owner_user_id` → `users.id` (ON DELETE CASCADE)
- ← `workspace_members.workspace_id`
- ← `chat_agent_sessions.workspace_id`
- ← `agents.workspace_id`
- ← `connections.workspace_id`
- ← `tools.workspace_id`
- ← `skills.workspace_id`
- ← `knowledge_bases.workspace_id`

---

### `workspace_members`

Membership and permission of a user in a workspace.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| workspace_id | uuid | NO | — | Workspace (`workspaces.id`) |
| user_id | uuid | NO | — | Member (`users.id`) |
| permission | text | NO | — | Access level (`workspace_permission`) |
| granted_by | uuid | NO | — | User who granted membership |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Primary key:** `(workspace_id, user_id)`

**Indexes**

- `workspace_members_user_id_idx` — on `user_id`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)
- `granted_by` → `users.id` (ON DELETE CASCADE)

---

### `chat_agent_sessions`

Unified LangGraph session metadata for in-app sandbox chats and production channel conversations.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | — | LangGraph thread id (matches chat `sessionId`) |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| agent_id | uuid | NO | — | Agent that owns the conversation (`agents.id`) |
| chat_env | text | NO | `web` | Target environment: `web`, `facebook_page`, `zalo`, etc. |
| user_id | uuid | YES | — | In-app sandbox owner (`users.id`); null for external channel participants |
| connection_id | uuid | YES | — | Production channel connection (`connections.id`) |
| external_participant_id | text | YES | — | Channel participant id (e.g. Facebook PSID) |
| title | text | NO | — | Preview label, typically the first user message |
| last_message_at | timestamptz | NO | `now()` | Last inbound/outbound activity |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `chat_agent_sessions_workspace_id_user_id_agent_id_chat_env_idx` — on `(workspace_id, user_id, agent_id, chat_env)`
- `chat_agent_sessions_connection_participant_chat_env_idx` — UNIQUE on `(connection_id, external_participant_id, chat_env)`
- `chat_agent_sessions_connection_id_idx` — on `connection_id`
- `chat_agent_sessions_updated_at_idx` — on `updated_at`
- `chat_agent_sessions_last_message_at_idx` — on `last_message_at`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)
- `agent_id` → `agents.id` (ON DELETE CASCADE)
- `connection_id` → `connections.id` (ON DELETE CASCADE)

**Session scope**

- In-app sandbox: `(workspace_id, user_id, agent_id, chat_env)`
- Production channel: `(connection_id, external_participant_id, chat_env)`

---

### `agents`

Configured chat agents for a workspace.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| name | text | NO | — | Display name |
| description | text | YES | — | Short summary of the agent's purpose |
| system_prompt | text | NO | — | Instructions that define agent behavior |
| first_message | text | YES | — | Greeting for channel openers (e.g. Messenger Get Started) |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `agents_workspace_id_idx` — on `workspace_id`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- ← `agent_tools.agent_id`
- ← `agent_skills.agent_id`
- ← `agent_knowledge_bases.agent_id`

---

### `tools`

Workspace-scoped tool instances that agents can call at runtime. Each row references a code-defined registry tool and stores workspace-specific name, description, slug, and config.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| name | text | NO | — | Display name override |
| tool_id | text | NO | — | Code-defined registry tool id (e.g. `http_api`, `mcp`) |
| slug | text | NO | — | Unique per workspace; referenced in agent prompts (e.g. `get_weather`) |
| description | text | YES | — | Short summary override shown in lists |
| config | jsonb | NO | — | Workspace config validated by the registry tool's `configSchema` |
| locked | boolean | NO | `false` | When true, blocks user view/edit/delete (script-only) |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `tools_workspace_id_idx` — on `workspace_id`
- `tools_tool_id_idx` — on `tool_id`
- `tools_workspace_id_slug_idx` — UNIQUE on `(workspace_id, slug)` (same registry `tool_id` may appear multiple times with different slugs)

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- ← `agent_tools.tool_id`

**Tool registry (code-defined, not a DB table)**

All tools are defined in code via `lib/tools/tool-registry.ts`. Each registry entry has:

| Field | Description |
| ----- | ----------- |
| id | Stable identifier (e.g. `http_api`) |
| name | Default display name (workspace may override) |
| description | Default summary (workspace may override) |
| inputShape / outputShape | Fixed JSON Schema shapes for the runtime AI agent |
| configSchema | Zod schema validating workspace `config` when adding the tool |
| configFields | Form metadata (labels, secrets) for the add-tool UI |

---

### `agent_tools`

Junction table linking chat agents to tools. UI for assignment is implemented separately.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| agent_id | uuid | NO | — | Chat agent (`agents.id`) |
| tool_id | uuid | NO | — | Tool (`tools.id`) |
| created_at | timestamptz | NO | `now()` | When the tool was linked |

**Primary key:** `(agent_id, tool_id)`

**Indexes**

- `agent_tools_tool_id_idx` — on `tool_id`

**Relations**

- `agent_id` → `agents.id` (ON DELETE CASCADE)
- `tool_id` → `tools.id` (ON DELETE CASCADE)

---

### `skills`

Workspace-scoped specialized capabilities assigned to agents. Each skill bundles instructions and optional tool slugs for runtime prompt and tool resolution.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| name | text | NO | — | Display name |
| slug | text | NO | — | URL-safe unique identifier per workspace |
| description | text | YES | — | Short summary shown in lists |
| tools | text[] | NO | `{}` | Workspace tool `slug` values (soft reference, validated in app) |
| instructions | text | NO | — | Skill-specific guidance injected into the agent system prompt |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `skills_workspace_id_idx` — on `workspace_id`
- `skills_workspace_id_slug_idx` — UNIQUE on `(workspace_id, slug)`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- ← `agent_skills.skill_id`

---

### `agent_skills`

Junction table linking chat agents to skills.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| agent_id | uuid | NO | — | Chat agent (`agents.id`) |
| skill_id | uuid | NO | — | Skill (`skills.id`) |
| created_at | timestamptz | NO | `now()` | When the skill was linked |

**Primary key:** `(agent_id, skill_id)`

**Indexes**

- `agent_skills_skill_id_idx` — on `skill_id`

**Relations**

- `agent_id` → `agents.id` (ON DELETE CASCADE)
- `skill_id` → `skills.id` (ON DELETE CASCADE)

---

### `connections`

External channel connections for a workspace (Facebook pages, etc.). Each connection is assigned to at most one chat agent.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| user_id | uuid | NO | — | User who created the connection (`users.id`) |
| agent_id | uuid | YES | — | Assigned chat agent (`agents.id`) |
| channel_type | text | NO | — | Channel identifier (e.g. `facebook`) |
| name | text | NO | — | Display name (e.g. Facebook page name) |
| encrypted_auth_data | text | NO | — | AES-256-GCM encrypted OAuth tokens |
| metadata | jsonb | YES | — | Non-sensitive channel metadata |
| last_error | text | YES | — | Last refresh/connect failure message |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `connections_workspace_id_idx` — on `workspace_id`
- `connections_user_id_idx` — on `user_id`
- `connections_agent_id_idx` — on `agent_id`
- `connections_channel_type_idx` — on `channel_type`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)
- `agent_id` → `agents.id` (ON DELETE SET NULL)

---

### `connection_inbound_dedup`

Tracks processed inbound message ids to avoid duplicate replies when Facebook retries webhooks.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| connection_id | uuid | NO | — | Connection (`connections.id`) |
| external_message_id | text | NO | — | Channel message id (e.g. Facebook `mid`) |
| processed_at | timestamptz | NO | `now()` | When the message was accepted |

**Indexes**

- `connection_inbound_dedup_connection_message_idx` — UNIQUE on `(connection_id, external_message_id)`

**Relations**

- `connection_id` → `connections.id` (ON DELETE CASCADE)

---

### `knowledge_bases`

Workspace-scoped document collections for agent retrieval.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| name | text | NO | — | Display name |
| slug | text | NO | — | URL-safe unique identifier per workspace |
| description | text | YES | — | Short summary |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `knowledge_bases_workspace_id_idx` — on `workspace_id`
- `knowledge_bases_workspace_id_slug_idx` — UNIQUE on `(workspace_id, slug)`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- ← `knowledge_base_documents.knowledge_base_id`
- ← `agent_knowledge_bases.knowledge_base_id`

---

### `knowledge_base_documents`

Uploaded files and ingestion pipeline state for a knowledge base.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| knowledge_base_id | uuid | NO | — | Parent KB (`knowledge_bases.id`) |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| filename | text | NO | — | Original filename |
| content_type | text | NO | — | MIME type |
| size_bytes | text | NO | — | File size in bytes (stored as text) |
| source_r2_key | text | NO | — | R2 key for uploaded source file |
| status | text | NO | `uploaded` | Pipeline status |
| detected_language | text | YES | — | `vi`, `en`, `mixed`, or `unknown` |
| chunk_strategy | text | YES | — | Selected chunk strategy id |
| classification_reason | text | YES | — | Heuristic or Haiku explanation |
| markdown_r2_key | text | YES | — | Converted markdown artifact |
| chunks_r2_key | text | YES | — | Chunk JSON artifact |
| index_result_r2_key | text | YES | — | Pinecone index result artifact |
| pipeline_log_r2_key | text | YES | — | Stage-by-stage pipeline log |
| chunk_count | text | YES | — | Number of chunks produced |
| pinecone_namespace | text | YES | — | Pinecone namespace (workspace id) |
| pinecone_record_count | text | YES | — | Number of vectors upserted |
| error_message | text | YES | — | Last pipeline error |
| processed_at | timestamptz | YES | — | When indexing completed |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `knowledge_base_documents_knowledge_base_id_idx` — on `knowledge_base_id`
- `knowledge_base_documents_workspace_id_idx` — on `workspace_id`
- `knowledge_base_documents_status_idx` — on `status`

**Relations**

- `knowledge_base_id` → `knowledge_bases.id` (ON DELETE CASCADE)
- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)

---

### `agent_knowledge_bases`

Junction table linking chat agents to knowledge bases. Assignment is owned by the agent service (agent adds/removes knowledge bases), not the knowledge-base module.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| agent_id | uuid | NO | — | Chat agent (`agents.id`) |
| knowledge_base_id | uuid | NO | — | Knowledge base (`knowledge_bases.id`) |
| created_at | timestamptz | NO | `now()` | When the KB was linked |

**Primary key:** `(agent_id, knowledge_base_id)`

**Indexes**

- `agent_knowledge_bases_knowledge_base_id_idx` — on `knowledge_base_id`

**Relations**

- `agent_id` → `agents.id` (ON DELETE CASCADE)
- `knowledge_base_id` → `knowledge_bases.id` (ON DELETE CASCADE)
