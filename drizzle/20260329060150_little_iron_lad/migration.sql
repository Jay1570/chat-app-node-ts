DROP INDEX "messages_conversation_idx";--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" ("conversationId","created_at" desc);