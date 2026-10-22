ALTER TABLE "ImportRecord"
ADD COLUMN "normalizedPayload" JSONB,
ADD COLUMN "normalizedAt" TIMESTAMP(3);
