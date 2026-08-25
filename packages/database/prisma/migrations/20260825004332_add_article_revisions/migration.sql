-- CreateTable
CREATE TABLE "ArticleRevision" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lead" TEXT,
    "content" JSONB NOT NULL,
    "isTopNews" BOOLEAN NOT NULL,
    "competitionId" UUID,
    "matchId" UUID,
    "leadMediaId" UUID,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "ogImageId" UUID,
    "clubIds" JSONB NOT NULL,
    "categoryIds" JSONB NOT NULL,
    "tagIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleRevision_articleId_createdAt_idx" ON "ArticleRevision"("articleId", "createdAt");

-- AddForeignKey
ALTER TABLE "ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
