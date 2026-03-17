-- CreateTable
CREATE TABLE IF NOT EXISTS "email_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "count" INTEGER NOT NULL DEFAULT 1,
    "last_occurred" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_events_email_idx" ON "email_events"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_events_type_idx" ON "email_events"("type");

-- CreateIndex
-- For UNIQUE INDEX, we need to check if it exists first
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'email_events_email_type_key'
    ) THEN
        CREATE UNIQUE INDEX "email_events_email_type_key" ON "email_events"("email", "type");
    END IF;
END $$;

