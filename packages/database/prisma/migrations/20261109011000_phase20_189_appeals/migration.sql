-- Task 189: User appeals of moderation cards and sanctions.
-- All changes are additive. No existing user records are modified.

CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED');

ALTER TYPE "AuditAction" ADD VALUE 'APPEAL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'APPEAL_RESOLVED';
ALTER TYPE "AuditTargetType" ADD VALUE 'APPEAL';

CREATE TABLE "Appeal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "moderationCardId" UUID,
    "sanctionId" UUID,
    "reason" TEXT NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" UUID,
    "decisionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Appeal_exactly_one_target_chk"
      CHECK (("moderationCardId" IS NOT NULL) <> ("sanctionId" IS NOT NULL))
);

CREATE UNIQUE INDEX "Appeal_userId_moderationCardId_key"
    ON "Appeal"("userId", "moderationCardId");

CREATE UNIQUE INDEX "Appeal_userId_sanctionId_key"
    ON "Appeal"("userId", "sanctionId");

CREATE INDEX "Appeal_status_createdAt_idx" ON "Appeal"("status", "createdAt");
CREATE INDEX "Appeal_userId_createdAt_idx" ON "Appeal"("userId", "createdAt");

ALTER TABLE "Appeal"
    ADD CONSTRAINT "Appeal_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appeal"
    ADD CONSTRAINT "Appeal_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appeal"
    ADD CONSTRAINT "Appeal_moderationCardId_fkey"
    FOREIGN KEY ("moderationCardId") REFERENCES "ModerationCard"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appeal"
    ADD CONSTRAINT "Appeal_sanctionId_fkey"
    FOREIGN KEY ("sanctionId") REFERENCES "Sanction"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
