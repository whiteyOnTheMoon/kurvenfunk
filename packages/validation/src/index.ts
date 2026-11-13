export { entityIdSchema, nonEmptyStringSchema, slugSchema, timestampSchema } from './common.js';
export {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  RESERVED_NICKNAMES,
  nicknameSchema,
  selectNicknameSchema,
  type SelectNicknameInput,
} from './nickname.js';
export {
  clubFanPreferenceSchema,
  completeOnboardingSchema,
  fanPreferenceSelectionSchema,
  neutralFanPreferenceSchema,
  type CompleteOnboardingInput,
  type FanPreferenceSelection,
} from './fan-preference.js';

export {
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  updateProfileSchema,
  type UpdateProfileInput,
} from './profile.ts';

export {
  articleContentSchema,
  createArticleSchema,
  updateArticleSchema,
  articlePublicationStatusSchema,
  articlePublicationWorkflowSchema,
  type CreateArticleInput,
  type UpdateArticleInput,
  type ArticlePublicationStatus,
  type ArticlePublicationWorkflowInput,
} from './article.js';

export {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './category.js';
export {
  createForumCategorySchema,
  updateForumCategorySchema,
  type CreateForumCategoryInput,
  type UpdateForumCategoryInput,
} from './forum-category.js';
export {
  FORUM_THREAD_TITLE_MAX_LENGTH,
  FORUM_THREAD_BODY_MAX_LENGTH,
  createForumThreadSchema,
  createForumReplySchema,
  setForumReadPositionSchema,
  lockForumThreadSchema,
  type LockForumThreadInput,
  type SetForumReadPositionInput,
  type CreateForumThreadInput,
  type CreateForumReplyInput,
} from './forum-thread.js';
export {
  createTagSchema,
  updateTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
} from './tag.js';
export {
  createCompetitionSchema,
  updateCompetitionSchema,
  type CreateCompetitionInput,
  type UpdateCompetitionInput,
} from './competition.js';
export {
  createSeasonSchema,
  updateSeasonSchema,
  seasonStatusSchema,
  type CreateSeasonInput,
  type UpdateSeasonInput,
} from './season.js';
export {
  clubColorSchema,
  createClubSchema,
  updateClubSchema,
  type CreateClubInput,
  type UpdateClubInput,
} from './club-management.js';
export {
  fixtureStatusSchema,
  createFixtureSchema,
  updateFixtureSchema,
  type CreateFixtureInput,
  type UpdateFixtureInput,
} from './match-management.js';
export {
  resultStatusSchema,
  updateMatchResultSchema,
  type UpdateMatchResultInput,
} from './match-result.js';
export {
  createStandingSchema,
  updateStandingSchema,
  type CreateStandingInput,
  type UpdateStandingInput,
} from './standing-management.js';
export {
  standingCalculationPreviewSchema,
  standingCalculationApplySchema,
  type StandingCalculationPreviewInput,
  type StandingCalculationApplyInput,
} from './standing-calculation.js';
export * from './media.js';
export {
  COMMENT_BODY_MAX_LENGTH,
  createCommentSchema,
  type CreateCommentInput,
} from './comment.js';
