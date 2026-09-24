DROP INDEX "knowledge_bases_workspace_id_slug_idx";--> statement-breakpoint
DROP INDEX "skills_workspace_id_slug_idx";--> statement-breakpoint
DROP INDEX "tools_workspace_id_slug_idx";--> statement-breakpoint
ALTER TABLE "knowledge_bases" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "skills" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "skills" DROP COLUMN "tools";--> statement-breakpoint
ALTER TABLE "tools" DROP COLUMN "slug";