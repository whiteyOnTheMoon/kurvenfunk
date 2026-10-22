-- Prevent duplicate comment reports by the same reporter.
-- Partial unique index because reports can also target posts and users.

CREATE UNIQUE INDEX "ModerationReport_reporter_comment_once_idx"
ON "ModerationReport" ("reporterId", "commentId")
WHERE "commentId" IS NOT NULL;
