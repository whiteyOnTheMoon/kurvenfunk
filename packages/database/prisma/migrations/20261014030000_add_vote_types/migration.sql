-- Add voting types while retaining LIKE for compatibility.
ALTER TYPE "ReactionType" ADD VALUE IF NOT EXISTS 'UPVOTE';
ALTER TYPE "ReactionType" ADD VALUE IF NOT EXISTS 'DOWNVOTE';
