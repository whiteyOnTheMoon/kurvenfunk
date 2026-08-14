-- Replace the case-sensitive nickname uniqueness constraint with a
-- case-insensitive PostgreSQL expression index.
DROP INDEX IF EXISTS "User_nickname_key";

CREATE UNIQUE INDEX "User_nickname_lower_key"
ON "User" (LOWER("nickname"))
WHERE "nickname" IS NOT NULL;
