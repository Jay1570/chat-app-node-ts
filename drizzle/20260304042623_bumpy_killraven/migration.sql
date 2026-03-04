CREATE TYPE "conversation_type_enum" AS ENUM('direct', 'group');--> statement-breakpoint
CREATE TABLE "conversation_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user1_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user2_id_users_id_fkey";--> statement-breakpoint
DROP INDEX "unique_conversation_pair";--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "type" "conversation_type_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_edited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "user1_id";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "user2_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "is_read";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_member_per_conversation" ON "conversation_member" ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" ("conversationId");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" ("senderId");--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id");--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_last_read_message_id_messages_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "messages"("id");