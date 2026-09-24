ALTER TABLE "agent_skills" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_tools" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skills_agent_id_slug_idx" ON "agent_skills" USING btree ("agent_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_tools_agent_id_slug_idx" ON "agent_tools" USING btree ("agent_id","slug");