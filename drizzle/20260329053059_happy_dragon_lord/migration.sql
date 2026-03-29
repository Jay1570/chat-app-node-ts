CREATE TYPE "conversation_status_enum" AS ENUM('pending', 'active');--> statement-breakpoint
CREATE TABLE "conversation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"sender_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"conversationId" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_member" ADD COLUMN "status" "conversation_status_enum" DEFAULT 'pending'::"conversation_status_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "status" "conversation_status_enum" DEFAULT 'pending'::"conversation_status_enum" NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pending_request" ON "conversation_request" ("sender_id","receiver_id","conversationId");--> statement-breakpoint
ALTER TABLE "conversation_request" ADD CONSTRAINT "conversation_request_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "conversation_request" ADD CONSTRAINT "conversation_request_receiver_id_users_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "conversation_request" ADD CONSTRAINT "conversation_request_conversationId_conversations_id_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;