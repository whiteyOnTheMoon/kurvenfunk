-- At most one operational season per competition, including concurrent writes.
-- Historical, planned and cancelled seasons are retained.
CREATE UNIQUE INDEX "Season_one_active_per_competition_idx"
ON "Season" ("competitionId")
WHERE "active" = true;
