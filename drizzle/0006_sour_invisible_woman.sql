ALTER TABLE "connection_conversations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "connection_conversations" CASCADE;--> statement-breakpoint
DROP INDEX "chat_agent_sessions_workspace_id_user_id_idx";--> statement-breakpoint
DROP INDEX "chat_agent_sessions_workspace_id_user_id_agent_id_idx";--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ADD COLUMN "chat_env" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ADD COLUMN "connection_id" uuid;--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ADD COLUMN "external_participant_id" text;--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ADD COLUMN "last_message_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_agent_sessions" ADD CONSTRAINT "chat_agent_sessions_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_agent_sessions_workspace_id_user_id_agent_id_chat_env_idx" ON "chat_agent_sessions" USING btree ("workspace_id","user_id","agent_id","chat_env");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_agent_sessions_connection_participant_chat_env_idx" ON "chat_agent_sessions" USING btree ("connection_id","external_participant_id","chat_env");--> statement-breakpoint
CREATE INDEX "chat_agent_sessions_connection_id_idx" ON "chat_agent_sessions" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "chat_agent_sessions_last_message_at_idx" ON "chat_agent_sessions" USING btree ("last_message_at");