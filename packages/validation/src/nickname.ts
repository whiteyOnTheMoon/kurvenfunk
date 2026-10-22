import { z } from 'zod';

export const NICKNAME_MIN_LENGTH = 3;
export const NICKNAME_MAX_LENGTH = 24;

export const RESERVED_NICKNAMES = [
  'admin',
  'moderator',
  'kurvenfunk',
  'support',
  'system',
] as const;

export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN_LENGTH, `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters long`)
  .max(NICKNAME_MAX_LENGTH, `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters long`)
  .regex(/^[A-Za-z0-9_-]+$/, 'Nickname may only contain letters, numbers, underscores and hyphens')
  .refine(
    (nickname) =>
      !RESERVED_NICKNAMES.includes(nickname.toLowerCase() as (typeof RESERVED_NICKNAMES)[number]),
    {
      message: 'Nickname is reserved',
    },
  );

export const selectNicknameSchema = z.object({
  nickname: nicknameSchema,
});

export type SelectNicknameInput = z.infer<typeof selectNicknameSchema>;
