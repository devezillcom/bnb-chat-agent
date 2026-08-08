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

Persisted chat/agent conversation sessions.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | — | LangGraph thread id (matches chat `sessionId`) |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| user_id | uuid | NO | — | Session owner (`users.id`) |
| title | text | NO | — | Preview label, typically the first user message |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `chat_agent_sessions_workspace_id_user_id_idx` — on `(workspace_id, user_id)`
- `chat_agent_sessions_updated_at_idx` — on `updated_at`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

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

---

### `tools`

Workspace-scoped tools that agents can call at runtime. Handler input/output JSON Schema lives in the handler registry; each row stores user config for that handler.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | `gen_random_uuid()` | Primary key |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| name | text | NO | — | Display name (not unique) |
| handler_key | text | NO | — | User-chosen identifier unique per workspace; passed to handlers at runtime |
| handler_type | text | NO | — | Registry key that selects the handler implementation (e.g. `http_api`, `mcp`) |
| description | text | YES | — | Short summary shown in lists |
| config | jsonb | NO | — | User-provided values matching the handler config shape |
| locked | boolean | NO | `false` | When true, blocks user view/edit/delete (script-only) |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `tools_workspace_id_idx` — on `workspace_id`
- `tools_handler_type_idx` — on `handler_type`
- `tools_workspace_id_handler_key_idx` — UNIQUE on `(workspace_id, handler_key)`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- ← `agent_tools.tool_id`

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

### `connection_conversations`

Per-customer chat sessions for external channel connections (e.g. Facebook PSID). Each row maps to a LangGraph `thread_id`.

| Column | Type | Nullable | Default | Description |
| ------ | ---- | -------- | ------- | ----------- |
| id | uuid | NO | — | LangGraph thread id |
| workspace_id | uuid | NO | — | Owning workspace (`workspaces.id`) |
| connection_id | uuid | NO | — | Channel connection (`connections.id`) |
| agent_id | uuid | NO | — | Agent serving this conversation (`agents.id`) |
| external_participant_id | text | NO | — | Channel participant id (e.g. Facebook PSID) |
| title | text | NO | — | Preview label |
| last_message_at | timestamptz | NO | `now()` | Last inbound/outbound activity |
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `connection_conversations_connection_participant_idx` — UNIQUE on `(connection_id, external_participant_id)`
- `connection_conversations_workspace_id_idx` — on `workspace_id`
- `connection_conversations_connection_id_idx` — on `connection_id`
- `connection_conversations_last_message_at_idx` — on `last_message_at`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
- `connection_id` → `connections.id` (ON DELETE CASCADE)
- `agent_id` → `agents.id` (ON DELETE CASCADE)

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
