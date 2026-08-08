import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    firebaseUid: text("firebase_uid").notNull().unique(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspaces_slug_idx").on(table.slug),
    index("workspaces_owner_user_id_idx").on(table.ownerUserId),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    grantedBy: uuid("granted_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.workspaceId, table.userId] }),
    index("workspace_members_user_id_idx").on(table.userId),
  ],
);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export const chatAgentSessions = pgTable(
  "chat_agent_sessions",
  {
    /** LangGraph thread id — matches chat `sessionId`. */
    id: uuid("id").primaryKey().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Preview label, typically the first user message. */
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("chat_agent_sessions_workspace_id_user_id_idx").on(
      table.workspaceId,
      table.userId,
    ),
    index("chat_agent_sessions_updated_at_idx").on(table.updatedAt),
  ],
);

export type ChatAgentSession = typeof chatAgentSessions.$inferSelect;
export type NewChatAgentSession = typeof chatAgentSessions.$inferInsert;

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    /** Greeting sent on Messenger Get Started (and similar channel openers). */
    firstMessage: text("first_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("agents_workspace_id_idx").on(table.workspaceId)],
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export const connections = pgTable(
  "connections",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id").references(() => agents.id, {
      onDelete: "set null",
    }),
    channelType: text("channel_type").notNull(),
    name: text("name").notNull(),
    encryptedAuthData: text("encrypted_auth_data").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("connections_workspace_id_idx").on(table.workspaceId),
    index("connections_user_id_idx").on(table.userId),
    index("connections_agent_id_idx").on(table.agentId),
    index("connections_channel_type_idx").on(table.channelType),
  ],
);

export type Connection = typeof connections.$inferSelect;
export type NewConnection = typeof connections.$inferInsert;

export const connectionConversations = pgTable(
  "connection_conversations",
  {
    /** LangGraph thread id for this customer conversation. */
    id: uuid("id").primaryKey().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    /** Channel-specific participant id (e.g. Facebook PSID). */
    externalParticipantId: text("external_participant_id").notNull(),
    title: text("title").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("connection_conversations_connection_participant_idx").on(
      table.connectionId,
      table.externalParticipantId,
    ),
    index("connection_conversations_workspace_id_idx").on(table.workspaceId),
    index("connection_conversations_connection_id_idx").on(table.connectionId),
    index("connection_conversations_last_message_at_idx").on(
      table.lastMessageAt,
    ),
  ],
);

export type ConnectionConversation =
  typeof connectionConversations.$inferSelect;
export type NewConnectionConversation =
  typeof connectionConversations.$inferInsert;

export const connectionInboundDedup = pgTable(
  "connection_inbound_dedup",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => connections.id, { onDelete: "cascade" }),
    externalMessageId: text("external_message_id").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("connection_inbound_dedup_connection_message_idx").on(
      table.connectionId,
      table.externalMessageId,
    ),
  ],
);

export type ConnectionInboundDedup = typeof connectionInboundDedup.$inferSelect;
export type NewConnectionInboundDedup =
  typeof connectionInboundDedup.$inferInsert;

/** User-provided config values matching the handler's config shape. */
export type ToolConfig = Record<string, string>;

export const tools = pgTable(
  "tools",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** User-chosen identifier unique per workspace; passed to handlers at runtime. */
    handlerKey: text("handler_key").notNull(),
    /** Registry key that selects the handler implementation (e.g. http_api, mcp). */
    handlerType: text("handler_type").notNull(),
    description: text("description"),
    config: jsonb("config").$type<ToolConfig>().notNull(),
    /** When true, users cannot view detail, edit, or delete — set only via scripts. */
    locked: boolean("locked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tools_workspace_id_idx").on(table.workspaceId),
    index("tools_handler_type_idx").on(table.handlerType),
    uniqueIndex("tools_workspace_id_handler_key_idx").on(
      table.workspaceId,
      table.handlerKey,
    ),
  ],
);

export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;

export const agentTools = pgTable(
  "agent_tools",
  {
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.toolId] }),
    index("agent_tools_tool_id_idx").on(table.toolId),
  ],
);

export type AgentTool = typeof agentTools.$inferSelect;
export type NewAgentTool = typeof agentTools.$inferInsert;
