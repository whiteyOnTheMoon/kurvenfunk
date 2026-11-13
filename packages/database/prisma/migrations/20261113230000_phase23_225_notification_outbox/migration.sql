-- Phase 23.225: transactional notification-to-queue handoff.
-- All live Notification rows remain unchanged. No backfill or synthetic events.
CREATE TABLE "NotificationOutbox" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastErrorCode" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationOutbox_notificationId_key"
    ON "NotificationOutbox"("notificationId");
CREATE INDEX "NotificationOutbox_processedAt_nextAttemptAt_idx"
    ON "NotificationOutbox"("processedAt", "nextAttemptAt");
ALTER TABLE "NotificationOutbox"
    ADD CONSTRAINT "NotificationOutbox_notificationId_fkey"
    FOREIGN KEY ("notificationId") REFERENCES "Notification"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
