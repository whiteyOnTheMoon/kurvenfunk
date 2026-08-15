import { z } from 'zod';
import { nicknameSchema } from './nickname.ts';

export const clubFanPreferenceSchema = z.object({
  fanPreference: z.literal('CLUB'),
  favoriteClubId: z.string().uuid(),
});

export const neutralFanPreferenceSchema = z.object({
  fanPreference: z.literal('NEUTRAL'),
  favoriteClubId: z.null(),
});

export const fanPreferenceSelectionSchema = z.discriminatedUnion('fanPreference', [
  clubFanPreferenceSchema,
  neutralFanPreferenceSchema,
]);

export type FanPreferenceSelection = z.infer<typeof fanPreferenceSelectionSchema>;

export const completeOnboardingSchema = z.discriminatedUnion('fanPreference', [
  clubFanPreferenceSchema.extend({
    nickname: nicknameSchema,
  }),
  neutralFanPreferenceSchema.extend({
    nickname: nicknameSchema,
  }),
]);

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
