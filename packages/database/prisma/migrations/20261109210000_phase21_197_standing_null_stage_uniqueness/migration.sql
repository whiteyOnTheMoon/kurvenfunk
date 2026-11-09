-- PostgreSQL considers NULL values distinct in a normal composite UNIQUE constraint.
-- Preserve one stable Standing identity per (season, club) without a Stage.
-- Fail closed if duplicates already exist; never delete historical standings.
CREATE UNIQUE INDEX "Standing_season_club_null_stage_unique_idx"
  ON "Standing" ("seasonId", "clubId")
  WHERE "stageId" IS NULL;
