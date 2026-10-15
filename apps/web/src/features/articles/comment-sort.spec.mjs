import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sortTopLevelComments } from './comment-sort.ts';

const comments = [
  {
    id: 'old',
    parentId: null,
    createdAt: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 'reply',
    parentId: 'old',
    createdAt: '2026-10-14T10:00:00.000Z',
  },
  {
    id: 'new',
    parentId: null,
    createdAt: '2026-10-12T10:00:00.000Z',
  },
  {
    id: 'middle',
    parentId: null,
    createdAt: '2026-10-11T10:00:00.000Z',
  },
];

const summaries = {
  old: { score: 4 },
  middle: { score: 4 },
  new: { score: -1 },
  reply: { score: 100 },
};

function ids(mode, votes = summaries) {
  return sortTopLevelComments(comments, votes, mode).map((comment) => comment.id);
}

test('newest sorts top-level comments newest first', () => {
  assert.deepEqual(ids('newest'), ['new', 'middle', 'old']);
});

test('oldest sorts top-level comments oldest first', () => {
  assert.deepEqual(ids('oldest'), ['old', 'middle', 'new']);
});

test('popular sorts by vote score descending', () => {
  assert.deepEqual(ids('popular'), ['middle', 'old', 'new']);
});

test('replies do not appear as top-level comments', () => {
  assert.equal(ids('popular').includes('reply'), false);
});

test('popular falls back to newest when scores are unavailable', () => {
  assert.deepEqual(ids('popular', {}), ['new', 'middle', 'old']);
});

test('sorting does not mutate the source list', () => {
  const before = comments.map((comment) => comment.id);

  sortTopLevelComments(comments, summaries, 'oldest');

  assert.deepEqual(
    comments.map((comment) => comment.id),
    before,
  );
});

test('equal timestamps use a deterministic ID tie-breaker', () => {
  const sameTime = [
    {
      id: 'beta',
      parentId: null,
      createdAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'alpha',
      parentId: null,
      createdAt: '2026-10-10T10:00:00.000Z',
    },
  ];

  assert.deepEqual(
    sortTopLevelComments(sameTime, {}, 'newest').map((comment) => comment.id),
    ['alpha', 'beta'],
  );
});
