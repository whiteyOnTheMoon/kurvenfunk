-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LIMITED', 'BANNED');

-- CreateEnum
CREATE TYPE "FanPreference" AS ENUM ('UNSET', 'CLUB', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'TRUSTED_USER', 'MODERATOR', 'EDITOR', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "ClubAliasType" AS ENUM ('OFFICIAL_VARIANT', 'SHORT_NAME', 'ABBREVIATION', 'ALTERNATIVE', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('LEAGUE', 'CUP');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('REGULAR', 'GROUP', 'KNOCKOUT');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MediaStorageType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'DELETED', 'MODERATED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'LOCKED', 'MERGED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('COMMENT', 'FORUM_POST', 'USER');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_OR_ABUSE', 'THREAT_OR_VIOLENCE', 'PRIVACY', 'IMPERSONATION', 'ILLEGAL_CONTENT', 'OFF_TOPIC', 'MISINFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportResolution" AS ENUM ('ACTION_TAKEN', 'NO_VIOLATION', 'INSUFFICIENT_EVIDENCE', 'DUPLICATE', 'ALREADY_HANDLED', 'INVALID_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationCardType" AS ENUM ('YELLOW', 'BLUE', 'RED');

-- CreateEnum
CREATE TYPE "ModerationCardStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ModerationCardEscalationSource" AS ENUM ('MANUAL', 'THREE_YELLOW_CARDS');

-- CreateEnum
CREATE TYPE "ModerationCardSourceType" AS ENUM ('COMMENT', 'FORUM_POST', 'THREAD', 'ARTICLE', 'USER', 'NONE');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('LIMITED', 'COMMENT_BLOCK', 'FORUM_BLOCK', 'ACCOUNT_BAN', 'IP_BLOCK');

-- CreateEnum
CREATE TYPE "SanctionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "IPBlockSource" AS ENUM ('MANUAL', 'SANCTION', 'AUTOMATED_SECURITY', 'RATE_LIMIT_ESCALATION');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM', 'WORKER', 'SECURITY_AUTOMATION');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTHORIZATION', 'ACCOUNT', 'MODERATION', 'SANCTION', 'IP_PROTECTION', 'CONTENT', 'FORUM', 'EDITORIAL', 'SECURITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditTargetType" AS ENUM ('USER', 'MODERATION_REPORT', 'MODERATION_CARD', 'SANCTION', 'IP_BLOCK', 'COMMENT', 'FORUM', 'THREAD', 'FORUM_POST', 'ARTICLE', 'MEDIA', 'CLUB', 'MATCH', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_ROLE_GRANTED', 'USER_ROLE_REVOKED', 'USER_STATUS_CHANGED', 'MODERATION_REPORT_ASSIGNED', 'MODERATION_REPORT_RESOLVED', 'MODERATION_REPORT_DISMISSED', 'MODERATION_CARD_CREATED', 'MODERATION_CARD_REVOKED', 'MODERATION_CARD_EXPIRED', 'MODERATION_CARD_NOTE_CHANGED', 'SANCTION_CREATED', 'SANCTION_EXTENDED', 'SANCTION_REVOKED', 'SANCTION_EXPIRED', 'IP_BLOCK_CREATED', 'IP_BLOCK_EXTENDED', 'IP_BLOCK_DEACTIVATED', 'IP_BLOCK_EXPIRED', 'IP_BLOCK_REACTIVATED', 'COMMENT_MODERATED', 'COMMENT_DELETED_BY_MODERATOR', 'COMMENT_RESTORED_BY_MODERATOR', 'THREAD_PINNED', 'THREAD_UNPINNED', 'THREAD_LOCKED', 'THREAD_UNLOCKED', 'THREAD_MOVED', 'THREAD_MERGED', 'POST_MODERATED', 'POST_DELETED_BY_MODERATOR', 'POST_RESTORED_BY_MODERATOR', 'ARTICLE_PUBLISHED', 'ARTICLE_UNPUBLISHED', 'ARTICLE_ARCHIVED', 'ADMIN_CORRECTION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('COMMENT_REPLY', 'THREAD_REPLY', 'YELLOW_CARD', 'BLUE_CARD', 'RED_CARD', 'LIMITED', 'BAN', 'APPEAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationSourceType" AS ENUM ('COMMENT', 'POST', 'THREAD', 'MODERATION_CARD', 'SANCTION', 'APPEAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('NEWS', 'SPORTS', 'HYBRID');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DEGRADED');

-- CreateEnum
CREATE TYPE "ImportTrigger" AS ENUM ('SCHEDULED', 'MANUAL', 'RETRY', 'REPLAY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIALLY_SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ImportJobKind" AS ENUM ('NEWS_FETCH', 'NEWS_REPLAY', 'SPORTS_COMPETITIONS', 'SPORTS_SEASONS', 'SPORTS_CLUBS', 'SPORTS_FIXTURES', 'SPORTS_RESULTS', 'SPORTS_STANDINGS', 'ENTITY_REPROCESS', 'RAW_PAYLOAD_REPROCESS', 'MANUAL_REPLAY');

-- CreateEnum
CREATE TYPE "ImportRecordType" AS ENUM ('NEWS_ARTICLE', 'SPORTS_COMPETITION', 'SPORTS_SEASON', 'SPORTS_CLUB', 'SPORTS_MATCH', 'SPORTS_RESULT', 'SPORTS_STANDING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ImportRecordStatus" AS ENUM ('RECEIVED', 'NORMALIZED', 'VALIDATED', 'MATCHED', 'CREATED', 'UPDATED', 'DUPLICATE', 'SKIPPED', 'REVIEW_REQUIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "RawPayloadType" AS ENUM ('RESPONSE', 'RECORD', 'PAGE', 'WEBHOOK', 'REPLAY');

-- CreateEnum
CREATE TYPE "MatchEntityType" AS ENUM ('CLUB', 'COMPETITION', 'SEASON', 'MATCH', 'ARTICLE');

-- CreateEnum
CREATE TYPE "EntityMatchStatus" AS ENUM ('PENDING', 'MATCHED', 'UNMATCHED', 'AMBIGUOUS', 'REVIEW_REQUIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MatchConfidence" AS ENUM ('EXACT', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MatchMethod" AS ENUM ('EXTERNAL_ID', 'MANUAL', 'CANONICAL_NAME', 'ALIAS', 'COMPOSITE', 'HEURISTIC', 'IMPORT_HISTORY');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "keycloakSubject" TEXT NOT NULL,
    "nickname" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "fanPreference" "FanPreference" NOT NULL DEFAULT 'UNSET',
    "favoriteClubId" UUID,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "avatarMediaId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "grantedById" UUID,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "slug" TEXT NOT NULL,
    "logoMediaId" UUID,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubAlias" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "type" "ClubAliasType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "slug" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL,
    "countryCode" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "SeasonStatus" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "parentStageId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "StageType" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" UUID NOT NULL,
    "homeClubId" UUID NOT NULL,
    "awayClubId" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "stageId" UUID,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "matchday" INTEGER,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Standing" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "stageId" UUID,
    "clubId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "played" INTEGER NOT NULL,
    "won" INTEGER NOT NULL,
    "drawn" INTEGER NOT NULL,
    "lost" INTEGER NOT NULL,
    "goalsFor" INTEGER NOT NULL,
    "goalsAgainst" INTEGER NOT NULL,
    "goalDifference" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "deductionPoints" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Standing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "storageType" "MediaStorageType" NOT NULL,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "copyright" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSource" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lead" TEXT,
    "content" JSONB NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" UUID,
    "externalAuthorName" TEXT,
    "sourceId" UUID,
    "originalUrl" TEXT,
    "competitionId" UUID,
    "matchId" UUID,
    "leadMediaId" UUID,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleClub" (
    "articleId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleClub_pkey" PRIMARY KEY ("articleId","clubId")
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "articleId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("articleId","categoryId")
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "articleId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "authorId" UUID,
    "parentId" UUID,
    "body" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentRevision" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "commentId" UUID,
    "postId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Forum" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "clubId" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "threadCreationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" UUID NOT NULL,
    "forumId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',
    "pinnedAt" TIMESTAMP(3),
    "pinnedByUserId" UUID,
    "lockedAt" TIMESTAMP(3),
    "lockedByUserId" UUID,
    "lockReason" TEXT,
    "mergedIntoThreadId" UUID,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "lastPostAt" TIMESTAMP(3),
    "lastPostId" UUID,
    "lastPostSequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentPostId" UUID,
    "sequenceNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" UUID,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadSubscription" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadReadState" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadPostId" UUID,
    "lastReadSequenceNumber" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadReadState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "commentId" UUID,
    "postId" UUID,
    "reportedUserId" UUID,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assignedModeratorId" UUID,
    "resolution" "ReportResolution",
    "moderatorNote" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationCard" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "moderatorId" UUID,
    "type" "ModerationCardType" NOT NULL,
    "status" "ModerationCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "reasonCode" TEXT NOT NULL,
    "userMessage" TEXT,
    "moderatorNote" TEXT,
    "sourceType" "ModerationCardSourceType" NOT NULL DEFAULT 'NONE',
    "sourceId" UUID,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "escalationSource" "ModerationCardEscalationSource" NOT NULL DEFAULT 'MANUAL',
    "revokedAt" TIMESTAMP(3),
    "revokedById" UUID,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sanction" (
    "id" UUID NOT NULL,
    "type" "SanctionType" NOT NULL,
    "status" "SanctionStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" UUID,
    "createdById" UUID,
    "revokedById" UUID,
    "sourceCardId" UUID,
    "sourceReportId" UUID,
    "ipBlockId" UUID,
    "reasonCode" TEXT NOT NULL,
    "userMessage" TEXT,
    "internalNote" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sanction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPBlock" (
    "id" UUID NOT NULL,
    "ipHash" TEXT NOT NULL,
    "hashKeyVersion" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "internalNote" TEXT,
    "source" "IPBlockSource" NOT NULL,
    "createdById" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedById" UUID,
    "deactivationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IPBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" "AuditActorType" NOT NULL,
    "actorUserId" UUID,
    "actorLabel" TEXT,
    "action" "AuditAction" NOT NULL,
    "category" "AuditCategory" NOT NULL,
    "targetType" "AuditTargetType" NOT NULL,
    "targetId" UUID,
    "targetUserId" UUID,
    "requestId" TEXT,
    "correlationId" TEXT,
    "moderationReportId" UUID,
    "moderationCardId" UUID,
    "sanctionId" UUID,
    "ipBlockId" UUID,
    "reason" TEXT,
    "metadata" JSONB,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "sourceType" "NotificationSourceType",
    "sourceId" UUID,
    "actorUserId" UUID,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "capabilities" JSONB,
    "configuration" JSONB,
    "lastImportAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "kind" "ImportJobKind" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "trigger" "ImportTrigger" NOT NULL,
    "queueJobId" TEXT,
    "requestId" TEXT,
    "correlationId" TEXT,
    "retryOfJobId" UUID,
    "cursor" TEXT,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRecord" (
    "id" UUID NOT NULL,
    "importJobId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "rawPayloadId" UUID,
    "recordType" "ImportRecordType" NOT NULL,
    "status" "ImportRecordStatus" NOT NULL DEFAULT 'RECEIVED',
    "externalId" TEXT,
    "externalUrl" TEXT,
    "contentHash" TEXT,
    "canonicalEntityType" "MatchEntityType",
    "canonicalEntityId" UUID,
    "duplicateOfRecordId" UUID,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawPayload" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "importJobId" UUID,
    "type" "RawPayloadType" NOT NULL,
    "externalId" TEXT,
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "metadata" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawPayload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMatch" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "entityType" "MatchEntityType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalName" TEXT,
    "clubId" UUID,
    "competitionId" UUID,
    "seasonId" UUID,
    "matchId" UUID,
    "articleId" UUID,
    "status" "EntityMatchStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" "MatchConfidence" NOT NULL DEFAULT 'UNKNOWN',
    "method" "MatchMethod",
    "evidence" JSONB,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_keycloakSubject_key" ON "User"("keycloakSubject");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_favoriteClubId_idx" ON "User"("favoriteClubId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_avatarMediaId_idx" ON "Profile"("avatarMediaId");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_role_idx" ON "UserRoleAssignment"("role");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_grantedById_idx" ON "UserRoleAssignment"("grantedById");

-- CreateIndex
CREATE INDEX "UserRoleAssignment_expiresAt_idx" ON "UserRoleAssignment"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_active_idx" ON "Club"("active");

-- CreateIndex
CREATE INDEX "Club_logoMediaId_idx" ON "Club"("logoMediaId");

-- CreateIndex
CREATE INDEX "ClubAlias_clubId_idx" ON "ClubAlias"("clubId");

-- CreateIndex
CREATE INDEX "ClubAlias_normalizedAlias_idx" ON "ClubAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "ClubAlias_active_idx" ON "ClubAlias"("active");

-- CreateIndex
CREATE UNIQUE INDEX "ClubAlias_clubId_normalizedAlias_key" ON "ClubAlias"("clubId", "normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_active_idx" ON "Competition"("active");

-- CreateIndex
CREATE INDEX "Competition_type_idx" ON "Competition"("type");

-- CreateIndex
CREATE INDEX "Season_competitionId_active_idx" ON "Season"("competitionId", "active");

-- CreateIndex
CREATE INDEX "Season_status_idx" ON "Season"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Season_competitionId_slug_key" ON "Season"("competitionId", "slug");

-- CreateIndex
CREATE INDEX "Stage_seasonId_sequence_idx" ON "Stage"("seasonId", "sequence");

-- CreateIndex
CREATE INDEX "Stage_parentStageId_idx" ON "Stage"("parentStageId");

-- CreateIndex
CREATE UNIQUE INDEX "Stage_seasonId_slug_key" ON "Stage"("seasonId", "slug");

-- CreateIndex
CREATE INDEX "Match_kickoff_idx" ON "Match"("kickoff");

-- CreateIndex
CREATE INDEX "Match_competitionId_kickoff_idx" ON "Match"("competitionId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_seasonId_kickoff_idx" ON "Match"("seasonId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_stageId_kickoff_idx" ON "Match"("stageId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_homeClubId_kickoff_idx" ON "Match"("homeClubId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_awayClubId_kickoff_idx" ON "Match"("awayClubId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_status_kickoff_idx" ON "Match"("status", "kickoff");

-- CreateIndex
CREATE INDEX "Standing_seasonId_position_idx" ON "Standing"("seasonId", "position");

-- CreateIndex
CREATE INDEX "Standing_stageId_position_idx" ON "Standing"("stageId", "position");

-- CreateIndex
CREATE INDEX "Standing_clubId_seasonId_idx" ON "Standing"("clubId", "seasonId");

-- CreateIndex
CREATE INDEX "Standing_competitionId_seasonId_idx" ON "Standing"("competitionId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Standing_seasonId_stageId_clubId_key" ON "Standing"("seasonId", "stageId", "clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE INDEX "Media_status_idx" ON "Media"("status");

-- CreateIndex
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");

-- CreateIndex
CREATE INDEX "Media_mimeType_idx" ON "Media"("mimeType");

-- CreateIndex
CREATE INDEX "ArticleSource_active_idx" ON "ArticleSource"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_active_idx" ON "Category"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_active_idx" ON "Tag"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_scheduledAt_idx" ON "Article"("scheduledAt");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE INDEX "Article_sourceId_idx" ON "Article"("sourceId");

-- CreateIndex
CREATE INDEX "Article_competitionId_idx" ON "Article"("competitionId");

-- CreateIndex
CREATE INDEX "Article_matchId_idx" ON "Article"("matchId");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ArticleClub_clubId_idx" ON "ArticleClub"("clubId");

-- CreateIndex
CREATE INDEX "ArticleCategory_categoryId_idx" ON "ArticleCategory"("categoryId");

-- CreateIndex
CREATE INDEX "ArticleTag_tagId_idx" ON "ArticleTag"("tagId");

-- CreateIndex
CREATE INDEX "Comment_articleId_createdAt_idx" ON "Comment"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_createdAt_idx" ON "Comment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_createdAt_idx" ON "Comment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "CommentRevision_commentId_createdAt_idx" ON "CommentRevision"("commentId", "createdAt");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "Reaction"("commentId");

-- CreateIndex
CREATE INDEX "Reaction_postId_idx" ON "Reaction"("postId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_type_commentId_key" ON "Reaction"("userId", "type", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_type_postId_key" ON "Reaction"("userId", "type", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex
CREATE INDEX "ForumCategory_active_sortOrder_idx" ON "ForumCategory"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Forum_slug_key" ON "Forum"("slug");

-- CreateIndex
CREATE INDEX "Forum_categoryId_active_sortOrder_idx" ON "Forum"("categoryId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "Forum_clubId_idx" ON "Forum"("clubId");

-- CreateIndex
CREATE INDEX "Thread_forumId_status_pinnedAt_lastPostAt_idx" ON "Thread"("forumId", "status", "pinnedAt", "lastPostAt");

-- CreateIndex
CREATE INDEX "Thread_authorId_idx" ON "Thread"("authorId");

-- CreateIndex
CREATE INDEX "Thread_mergedIntoThreadId_idx" ON "Thread"("mergedIntoThreadId");

-- CreateIndex
CREATE INDEX "Thread_lastPostAt_idx" ON "Thread"("lastPostAt");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_forumId_slug_key" ON "Thread"("forumId", "slug");

-- CreateIndex
CREATE INDEX "Post_threadId_createdAt_idx" ON "Post"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_parentPostId_idx" ON "Post"("parentPostId");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_threadId_sequenceNumber_key" ON "Post"("threadId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "ThreadSubscription_threadId_idx" ON "ThreadSubscription"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadSubscription_userId_threadId_key" ON "ThreadSubscription"("userId", "threadId");

-- CreateIndex
CREATE INDEX "ThreadReadState_threadId_idx" ON "ThreadReadState"("threadId");

-- CreateIndex
CREATE INDEX "ThreadReadState_lastReadPostId_idx" ON "ThreadReadState"("lastReadPostId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadReadState_userId_threadId_key" ON "ThreadReadState"("userId", "threadId");

-- CreateIndex
CREATE INDEX "ModerationReport_status_createdAt_idx" ON "ModerationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_assignedModeratorId_status_createdAt_idx" ON "ModerationReport"("assignedModeratorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_reporterId_createdAt_idx" ON "ModerationReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationReport_commentId_idx" ON "ModerationReport"("commentId");

-- CreateIndex
CREATE INDEX "ModerationReport_postId_idx" ON "ModerationReport"("postId");

-- CreateIndex
CREATE INDEX "ModerationReport_reportedUserId_idx" ON "ModerationReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "ModerationReport_reason_createdAt_idx" ON "ModerationReport"("reason", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationCard_userId_type_idx" ON "ModerationCard"("userId", "type");

-- CreateIndex
CREATE INDEX "ModerationCard_userId_status_idx" ON "ModerationCard"("userId", "status");

-- CreateIndex
CREATE INDEX "ModerationCard_userId_type_status_expiresAt_idx" ON "ModerationCard"("userId", "type", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "ModerationCard_moderatorId_issuedAt_idx" ON "ModerationCard"("moderatorId", "issuedAt");

-- CreateIndex
CREATE INDEX "ModerationCard_sourceType_sourceId_idx" ON "ModerationCard"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ModerationCard_issuedAt_idx" ON "ModerationCard"("issuedAt");

-- CreateIndex
CREATE INDEX "ModerationCard_expiresAt_idx" ON "ModerationCard"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sanction_ipBlockId_key" ON "Sanction"("ipBlockId");

-- CreateIndex
CREATE INDEX "Sanction_userId_idx" ON "Sanction"("userId");

-- CreateIndex
CREATE INDEX "Sanction_userId_status_idx" ON "Sanction"("userId", "status");

-- CreateIndex
CREATE INDEX "Sanction_userId_type_status_idx" ON "Sanction"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "Sanction_type_status_idx" ON "Sanction"("type", "status");

-- CreateIndex
CREATE INDEX "Sanction_status_expiresAt_idx" ON "Sanction"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Sanction_sourceCardId_idx" ON "Sanction"("sourceCardId");

-- CreateIndex
CREATE INDEX "Sanction_sourceReportId_idx" ON "Sanction"("sourceReportId");

-- CreateIndex
CREATE INDEX "Sanction_createdById_idx" ON "Sanction"("createdById");

-- CreateIndex
CREATE INDEX "Sanction_createdAt_idx" ON "Sanction"("createdAt");

-- CreateIndex
CREATE INDEX "IPBlock_ipHash_hashKeyVersion_idx" ON "IPBlock"("ipHash", "hashKeyVersion");

-- CreateIndex
CREATE INDEX "IPBlock_active_expiresAt_idx" ON "IPBlock"("active", "expiresAt");

-- CreateIndex
CREATE INDEX "IPBlock_createdAt_idx" ON "IPBlock"("createdAt");

-- CreateIndex
CREATE INDEX "IPBlock_createdById_idx" ON "IPBlock"("createdById");

-- CreateIndex
CREATE INDEX "IPBlock_source_idx" ON "IPBlock"("source");

-- CreateIndex
CREATE INDEX "IPBlock_reasonCode_idx" ON "IPBlock"("reasonCode");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_occurredAt_idx" ON "AuditLog"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_occurredAt_idx" ON "AuditLog"("targetUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_occurredAt_idx" ON "AuditLog"("action", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_category_occurredAt_idx" ON "AuditLog"("category", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_occurredAt_idx" ON "AuditLog"("targetType", "targetId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_moderationReportId_occurredAt_idx" ON "AuditLog"("moderationReportId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_moderationCardId_occurredAt_idx" ON "AuditLog"("moderationCardId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_sanctionId_occurredAt_idx" ON "AuditLog"("sanctionId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_ipBlockId_occurredAt_idx" ON "AuditLog"("ipBlockId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_sourceType_sourceId_idx" ON "Notification"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Notification_actorUserId_idx" ON "Notification"("actorUserId");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_key_key" ON "Provider"("key");

-- CreateIndex
CREATE INDEX "Provider_status_idx" ON "Provider"("status");

-- CreateIndex
CREATE INDEX "Provider_type_idx" ON "Provider"("type");

-- CreateIndex
CREATE INDEX "ImportJob_providerId_idx" ON "ImportJob"("providerId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_kind_idx" ON "ImportJob"("kind");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_startedAt_idx" ON "ImportJob"("startedAt");

-- CreateIndex
CREATE INDEX "ImportJob_retryOfJobId_idx" ON "ImportJob"("retryOfJobId");

-- CreateIndex
CREATE INDEX "ImportJob_queueJobId_idx" ON "ImportJob"("queueJobId");

-- CreateIndex
CREATE INDEX "ImportRecord_importJobId_idx" ON "ImportRecord"("importJobId");

-- CreateIndex
CREATE INDEX "ImportRecord_providerId_recordType_externalId_idx" ON "ImportRecord"("providerId", "recordType", "externalId");

-- CreateIndex
CREATE INDEX "ImportRecord_status_idx" ON "ImportRecord"("status");

-- CreateIndex
CREATE INDEX "ImportRecord_canonicalEntityType_canonicalEntityId_idx" ON "ImportRecord"("canonicalEntityType", "canonicalEntityId");

-- CreateIndex
CREATE INDEX "ImportRecord_createdAt_idx" ON "ImportRecord"("createdAt");

-- CreateIndex
CREATE INDEX "ImportRecord_rawPayloadId_idx" ON "ImportRecord"("rawPayloadId");

-- CreateIndex
CREATE INDEX "RawPayload_providerId_payloadHash_idx" ON "RawPayload"("providerId", "payloadHash");

-- CreateIndex
CREATE INDEX "RawPayload_providerId_idx" ON "RawPayload"("providerId");

-- CreateIndex
CREATE INDEX "RawPayload_importJobId_idx" ON "RawPayload"("importJobId");

-- CreateIndex
CREATE INDEX "RawPayload_externalId_idx" ON "RawPayload"("externalId");

-- CreateIndex
CREATE INDEX "RawPayload_receivedAt_idx" ON "RawPayload"("receivedAt");

-- CreateIndex
CREATE INDEX "RawPayload_expiresAt_idx" ON "RawPayload"("expiresAt");

-- CreateIndex
CREATE INDEX "EntityMatch_providerId_idx" ON "EntityMatch"("providerId");

-- CreateIndex
CREATE INDEX "EntityMatch_entityType_idx" ON "EntityMatch"("entityType");

-- CreateIndex
CREATE INDEX "EntityMatch_externalId_idx" ON "EntityMatch"("externalId");

-- CreateIndex
CREATE INDEX "EntityMatch_status_idx" ON "EntityMatch"("status");

-- CreateIndex
CREATE INDEX "EntityMatch_clubId_idx" ON "EntityMatch"("clubId");

-- CreateIndex
CREATE INDEX "EntityMatch_competitionId_idx" ON "EntityMatch"("competitionId");

-- CreateIndex
CREATE INDEX "EntityMatch_seasonId_idx" ON "EntityMatch"("seasonId");

-- CreateIndex
CREATE INDEX "EntityMatch_matchId_idx" ON "EntityMatch"("matchId");

-- CreateIndex
CREATE INDEX "EntityMatch_articleId_idx" ON "EntityMatch"("articleId");

-- CreateIndex
CREATE INDEX "EntityMatch_lastSeenAt_idx" ON "EntityMatch"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMatch_providerId_entityType_externalId_key" ON "EntityMatch"("providerId", "entityType", "externalId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_favoriteClubId_fkey" FOREIGN KEY ("favoriteClubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubAlias" ADD CONSTRAINT "ClubAlias_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_parentStageId_fkey" FOREIGN KEY ("parentStageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeClubId_fkey" FOREIGN KEY ("homeClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayClubId_fkey" FOREIGN KEY ("awayClubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Standing" ADD CONSTRAINT "Standing_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ArticleSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_leadMediaId_fkey" FOREIGN KEY ("leadMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleClub" ADD CONSTRAINT "ArticleClub_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleClub" ADD CONSTRAINT "ArticleClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCategory" ADD CONSTRAINT "ArticleCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTag" ADD CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRevision" ADD CONSTRAINT "CommentRevision_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_pinnedByUserId_fkey" FOREIGN KEY ("pinnedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_mergedIntoThreadId_fkey" FOREIGN KEY ("mergedIntoThreadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_lastPostId_fkey" FOREIGN KEY ("lastPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadSubscription" ADD CONSTRAINT "ThreadSubscription_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadSubscription" ADD CONSTRAINT "ThreadSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadReadState" ADD CONSTRAINT "ThreadReadState_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadReadState" ADD CONSTRAINT "ThreadReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadReadState" ADD CONSTRAINT "ThreadReadState_lastReadPostId_fkey" FOREIGN KEY ("lastReadPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_assignedModeratorId_fkey" FOREIGN KEY ("assignedModeratorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationReport" ADD CONSTRAINT "ModerationReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCard" ADD CONSTRAINT "ModerationCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCard" ADD CONSTRAINT "ModerationCard_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCard" ADD CONSTRAINT "ModerationCard_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_sourceCardId_fkey" FOREIGN KEY ("sourceCardId") REFERENCES "ModerationCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "ModerationReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sanction" ADD CONSTRAINT "Sanction_ipBlockId_fkey" FOREIGN KEY ("ipBlockId") REFERENCES "IPBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPBlock" ADD CONSTRAINT "IPBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPBlock" ADD CONSTRAINT "IPBlock_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_moderationReportId_fkey" FOREIGN KEY ("moderationReportId") REFERENCES "ModerationReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_moderationCardId_fkey" FOREIGN KEY ("moderationCardId") REFERENCES "ModerationCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sanctionId_fkey" FOREIGN KEY ("sanctionId") REFERENCES "Sanction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_ipBlockId_fkey" FOREIGN KEY ("ipBlockId") REFERENCES "IPBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_retryOfJobId_fkey" FOREIGN KEY ("retryOfJobId") REFERENCES "ImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_rawPayloadId_fkey" FOREIGN KEY ("rawPayloadId") REFERENCES "RawPayload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_duplicateOfRecordId_fkey" FOREIGN KEY ("duplicateOfRecordId") REFERENCES "ImportRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawPayload" ADD CONSTRAINT "RawPayload_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawPayload" ADD CONSTRAINT "RawPayload_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMatch" ADD CONSTRAINT "EntityMatch_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
