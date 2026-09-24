DROP INDEX "agent_skills_agent_id_slug_idx";--> statement-breakpoint
DROP INDEX "agent_tools_agent_id_slug_idx";--> statement-breakpoint
ALTER TABLE "agent_skills" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "agent_tools" DROP COLUMN "slug";