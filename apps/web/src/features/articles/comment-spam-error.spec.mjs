import assert from 'node:assert/strict';
import test from 'node:test';

import { getCommentSpamErrorMessage } from './comment-spam-error.ts';

const expectedMessages = {
  COMMENT_POST_COOLDOWN: 'Bitte warte 5 Sekunden, bevor du erneut kommentierst.',

  COMMENT_RATE_LIMIT: 'Du hast zu viele Kommentare geschrieben. Bitte versuche es später erneut.',

  COMMENT_DUPLICATE_SPAM: 'Du hast diesen Kommentar vor Kurzem bereits veröffentlicht.',

  COMMENT_LINK_LIMIT: 'Pro Kommentar sind maximal zwei Links erlaubt.',

  COMMENT_SPAM_PROTECTION_UNAVAILABLE:
    'Kommentieren ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.',
};

for (const [code, expectedMessage] of Object.entries(expectedMessages)) {
  test(`maps ${code} to a German message`, () => {
    assert.equal(getCommentSpamErrorMessage(code), expectedMessage);
  });
}

test('returns undefined for unknown errors', () => {
  assert.equal(getCommentSpamErrorMessage('UNKNOWN_ERROR'), undefined);
});

test('returns undefined for missing error codes', () => {
  assert.equal(getCommentSpamErrorMessage(undefined), undefined);
});

test('returns undefined for invalid error types', () => {
  assert.equal(getCommentSpamErrorMessage({ code: 'COMMENT_RATE_LIMIT' }), undefined);
});

test('preserves existing permission error handling', () => {
  assert.equal(getCommentSpamErrorMessage('COMMENT_CREATE_FORBIDDEN'), undefined);

  assert.equal(getCommentSpamErrorMessage('COMMENT_REPLY_FORBIDDEN'), undefined);

  assert.equal(getCommentSpamErrorMessage('COMMENT_EDIT_FORBIDDEN'), undefined);
});
