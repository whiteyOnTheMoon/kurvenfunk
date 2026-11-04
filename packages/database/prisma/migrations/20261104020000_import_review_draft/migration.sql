-- Link an approved reviewed import record to at most one editorial draft.
ALTER TABLE "Article" ADD COLUMN "importRecordId" UUID;

CREATE UNIQUE INDEX "Article_importRecordId_key"
  ON "Article"("importRecordId");

ALTER TABLE "Article"
  ADD CONSTRAINT "Article_importRecordId_fkey"
  FOREIGN KEY ("importRecordId") REFERENCES "ImportRecord"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
