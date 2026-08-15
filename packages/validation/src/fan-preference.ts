import { z } from 'zod';

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
