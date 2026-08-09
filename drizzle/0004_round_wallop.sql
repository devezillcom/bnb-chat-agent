CREATE TABLE "agent_knowledge_bases" (
	"agent_id" uuid NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_knowledge_bases_agent_id_knowledge_base_id_pk" PRIMARY KEY("agent_id","knowledge_base_id")
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" text NOT NULL,
	"source_r2_key" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"detected_language" text,
	"chunk_strategy" text,
	"classification_reason" text,
	"markdown_r2_key" text,
	"chunks_r2_key" text,
	"index_result_r2_key" text,
	"pipeline_log_r2_key" text,
	"chunk_count" text,
	"pinecone_namespace" text,
	"pinecone_record_count" text,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_knowledge_bases" ADD CONSTRAINT "agent_knowledge_bases_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_knowledge_bases" ADD CONSTRAINT "agent_knowledge_bases_knowledge_base_id_knowledge_bases_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_documents" ADD CONSTRAINT "knowledge_base_documents_knowledge_base_id_knowledge_bases_id_fk" FOREIGN KEY ("knowledge_base_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_documents" ADD CONSTRAINT "knowledge_base_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_knowledge_bases_knowledge_base_id_idx" ON "agent_knowledge_bases" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_documents_knowledge_base_id_idx" ON "knowledge_base_documents" USING btree ("knowledge_base_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_documents_workspace_id_idx" ON "knowledge_base_documents" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_documents_status_idx" ON "knowledge_base_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_bases_workspace_id_idx" ON "knowledge_bases" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_bases_workspace_id_slug_idx" ON "knowledge_bases" USING btree ("workspace_id","slug");