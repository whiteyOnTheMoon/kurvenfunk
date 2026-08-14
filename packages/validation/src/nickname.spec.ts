import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  nicknameSchema,
  selectNicknameSchema,
} from './nickname.ts';

describe('nickname validation', () => {
  it('accepts a valid nickname', () => {
    assert.equal(nicknameSchema.parse('Rapid_1899'), 'Rapid_1899');
  });

  it('trims surrounding whitespace', () => {
    assert.equal(nicknameSchema.parse('  SturmFan  '), 'SturmFan');
  });

  it('rejects nicknames shorter than the minimum length', () => {
    assert.throws(
      () => nicknameSchema.parse('ab'),
      new RegExp(
        `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters long`,
      ),
    );
  });

  it('rejects nicknames longer than the maximum length', () => {
    assert.throws(
      () => nicknameSchema.parse('a'.repeat(NICKNAME_MAX_LENGTH + 1)),
      new RegExp(
        `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters long`,
      ),
    );
  });

  for (const nickname of [
    'rapid fan',
    'rapid.fan',
    'rapid@fan',
    'rapid!',
    'stürmer',
  ]) {
    it(`rejects invalid characters in ${nickname}`, () => {
      assert.throws(
        () => nicknameSchema.parse(nickname),
        /Nickname may only contain letters, numbers, underscores and hyphens/,
      );
    });
  }

  for (const nickname of [
    'admin',
    'ADMIN',
    'Moderator',
    'KURVENFUNK',
    'Support',
    'SYSTEM',
  ]) {
    it(`rejects reserved nickname ${nickname} case-insensitively`, () => {
      assert.throws(
        () => nicknameSchema.parse(nickname),
        /Nickname is reserved/,
      );
    });
  }

  it('validates the nickname selection payload', () => {
    assert.deepEqual(
      selectNicknameSchema.parse({
        nickname: 'AustriaFan',
      }),
      {
        nickname: 'AustriaFan',
      },
    );
  });
});
