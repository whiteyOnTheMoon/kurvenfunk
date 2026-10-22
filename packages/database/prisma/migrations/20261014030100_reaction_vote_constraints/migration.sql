-- Convert existing comment likes to upvotes.
-- Existing forum post likes remain unchanged.
UPDATE "Reaction"
SET "type" = 'UPVOTE'
WHERE "commentId" IS NOT NULL
  AND "type" = 'LIKE';

-- Each reaction must reference exactly one content target.
ALTER TABLE "Reaction"
ADD CONSTRAINT "Reaction_exactly_one_target_check"
CHECK (
  ("commentId" IS NOT NULL AND "postId" IS NULL)
  OR
  ("commentId" IS NULL AND "postId" IS NOT NULL)
);

-- Prevent simultaneous upvotes and downvotes by one user.
CREATE UNIQUE INDEX "Reaction_userId_commentId_key"
ON "Reaction"("userId", "commentId");

CREATE UNIQUE INDEX "Reaction_userId_postId_key"
ON "Reaction"("userId", "postId");

-- Remove the previous type-dependent uniqueness constraints.
DROP INDEX "Reaction_userId_type_commentId_key";
DROP INDEX "Reaction_userId_type_postId_key";
