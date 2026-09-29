ALTER TABLE "agents" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "conversation_starters" text[] DEFAULT ARRAY[]::text[] NOT NULL;