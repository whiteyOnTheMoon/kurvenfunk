-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "ogImageId" UUID,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateIndex
CREATE INDEX "Article_ogImageId_idx" ON "Article"("ogImageId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
