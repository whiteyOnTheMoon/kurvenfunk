import assert from 'node:assert/strict';
import test from 'node:test';

import { getLaunchCountdown, LAUNCH_TIMESTAMP } from './countdown-time.ts';

test('uses midnight in Vienna, not the browser timezone', () => {
  assert.equal(LAUNCH_TIMESTAMP, Date.parse('2026-12-31T23:00:00Z'));
});

test('shows exactly one remaining second', () => {
  assert.deepEqual(getLaunchCountdown(LAUNCH_TIMESTAMP - 1_000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
    finished: false,
  });
});

test('splits longer durations correctly', () => {
  assert.deepEqual(getLaunchCountdown(LAUNCH_TIMESTAMP - 90_061_000), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    finished: false,
  });
});

test('rounds a partial second up until launch', () => {
  assert.equal(getLaunchCountdown(LAUNCH_TIMESTAMP - 1).seconds, 1);
});

test('does not show negative values after launch', () => {
  assert.deepEqual(getLaunchCountdown(LAUNCH_TIMESTAMP + 10_000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    finished: true,
  });
});
