-- CreateEnum
CREATE TYPE "ImportReviewDecision" AS ENUM ('APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ImportRecord"
ADD COLUMN "reviewDecision" "ImportReviewDecision",
ADD COLUMN "reviewedById" UUID,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ImportRecord_status_createdAt_idx"
ON "ImportRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportRecord_reviewDecision_idx"
ON "ImportRecord"("reviewDecision");

-- CreateIndex
CREATE INDEX "ImportRecord_reviewedById_idx"
ON "ImportRecord"("reviewedById");

-- AddForeignKey
ALTER TABLE "ImportRecord"
ADD CONSTRAINT "ImportRecord_reviewedById_fkey"
FOREIGN KEY ("reviewedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
