-- Preserve valid rematches while rejecting an exact duplicated fixture, including
-- concurrent API/import writes. A kickoff correction updates the original Match ID.
-- Fail closed if existing DEV data violates the invariant; never delete history.
CREATE UNIQUE INDEX "Match_exact_fixture_unique_idx"
ON "Match" ("seasonId", "homeClubId", "awayClubId", "kickoff");
