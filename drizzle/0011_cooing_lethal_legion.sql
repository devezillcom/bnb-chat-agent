ALTER TABLE "connections" ADD COLUMN "public_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "connections_public_key_idx" ON "connections" USING btree ("public_key");