CREATE TABLE "connection_conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"external_participant_id" text NOT NULL,
	"title" text NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_inbound_dedup" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"external_message_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "first_message" text;--> statement-breakpoint
ALTER TABLE "connection_conversations" ADD CONSTRAINT "connection_conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_conversations" ADD CONSTRAINT "connection_conversations_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_conversations" ADD CONSTRAINT "connection_conversations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_inbound_dedup" ADD CONSTRAINT "connection_inbound_dedup_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "connection_conversations_connection_participant_idx" ON "connection_conversations" USING btree ("connection_id","external_participant_id");--> statement-breakpoint
CREATE INDEX "connection_conversations_workspace_id_idx" ON "connection_conversations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "connection_conversations_connection_id_idx" ON "connection_conversations" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "connection_conversations_last_message_at_idx" ON "connection_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_inbound_dedup_connection_message_idx" ON "connection_inbound_dedup" USING btree ("connection_id","external_message_id");