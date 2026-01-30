-- Add execution history fields to forge.tickets
ALTER TABLE "forge"."tickets" ADD COLUMN "last_execution_id" uuid;
ALTER TABLE "forge"."tickets" ADD COLUMN "execution_history" jsonb;
