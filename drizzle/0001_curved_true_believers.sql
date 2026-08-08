ALTER TABLE "tools" ADD COLUMN "handler_type" text NOT NULL;--> statement-breakpoint
CREATE INDEX "tools_handler_type_idx" ON "tools" USING btree ("handler_type");