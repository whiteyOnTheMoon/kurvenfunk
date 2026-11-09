-- Phase 20.190: additive, disabled-by-default second-review proposal metadata.
-- Existing appeals and decisions are not changed.
ALTER TYPE "AppealStatus" ADD VALUE 'PENDING_APPROVAL';
CREATE TYPE "AppealDecision" AS ENUM ('ACCEPTED', 'REJECTED');
ALTER TYPE "AuditAction" ADD VALUE 'APPEAL_DECISION_PROPOSED';
ALTER TYPE "AuditAction" ADD VALUE 'APPEAL_DECISION_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'APPEAL_DECISION_RETURNED';

ALTER TABLE "Appeal"
  ADD COLUMN "proposedById" UUID,
  ADD COLUMN "proposedDecision" "AppealDecision",
  ADD COLUMN "proposalNote" TEXT,
  ADD COLUMN "proposedAt" TIMESTAMP(3);

ALTER TABLE "Appeal"
  ADD CONSTRAINT "Appeal_proposedById_fkey"
  FOREIGN KEY ("proposedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Appeal_proposedById_status_idx" ON "Appeal"("proposedById", "status");
