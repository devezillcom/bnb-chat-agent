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
| created_at | timestamptz | NO | `now()` | Row creation time |
| updated_at | timestamptz | NO | `now()` | Last update time |

**Indexes**

- `agents_workspace_id_idx` — on `workspace_id`

**Relations**

- `workspace_id` → `workspaces.id` (ON DELETE CASCADE)
