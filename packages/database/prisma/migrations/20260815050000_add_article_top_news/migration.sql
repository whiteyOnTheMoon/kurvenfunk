-- AlterTable
ALTER TABLE "Article"
ADD COLUMN "isTopNews" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Article_isTopNews_publishedAt_idx"
ON "Article"("isTopNews", "publishedAt");
