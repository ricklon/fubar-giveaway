import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHour, canWin, remaining } from '../src/drawing.js';
test('award only at or after the chosen time, once in the matching hour', () => {
  const state = createHour(3_600_000, () => .5);
  assert.equal(canWin(state, 5_399_999), false);
  assert.equal(canWin(state, 5_400_000), true);
  assert.equal(canWin({...state, claimed:true}, 5_400_001), false);
  assert.equal(canWin(state, 7_200_000), false);
});
test('a new hour resets availability and countdown', () => {
  const state = createHour(7_200_000, () => 0);
  assert.equal(state.claimed, false);
  assert.equal(canWin(state, 7_200_000), true);
  assert.equal(remaining(7_199_999), 1);
  assert.equal(remaining(7_200_000), 3600);
});

test('late actual wins constrain the next hour’s entire random window', () => {
  const lastWinAt = 110 * 60_000; // 1:50
  const earliest = createHour(120 * 60_000, () => 0, lastWinAt);
  const latest = createHour(120 * 60_000, () => .999999999, lastWinAt);
  assert.equal(earliest.winAt, 140 * 60_000); // 2:20
  assert.ok(latest.winAt < 180 * 60_000);
  assert.equal(canWin(earliest, 140 * 60_000 - 1), false);
  assert.equal(canWin(earliest, 140 * 60_000), true);
});

test('refresh preserves the random moment and actual win across rollover', async () => {
  const { restoreHour } = await import('../src/drawing.js');
  const won = { ...createHour(60 * 60_000, () => 0), claimed: true, lastWinAt: 119 * 60_000 };
  const next = restoreHour(JSON.parse(JSON.stringify(won)), 120 * 60_000, () => .5);
  assert.equal(next.lastWinAt, won.lastWinAt);
  assert.ok(next.winAt >= 149 * 60_000);
  assert.deepEqual(restoreHour(next, 125 * 60_000, () => { throw Error('must not reroll'); }), next);
  assert.equal(canWin(next, 121 * 60_000), false);
});

test('old claims migrate conservatively; skipped hours retain history', async () => {
  const { restoreHour } = await import('../src/drawing.js');
  const legacy = { hour: 1, winAt: 3_600_000, claimed: true };
  const next = restoreHour(legacy, 7_200_000, () => 0);
  assert.equal(next.winAt, 8_999_999);
  const later = restoreHour(next, 18_000_000, () => 0);
  assert.equal(later.lastWinAt, 7_199_999);
  assert.equal(later.winAt, 18_000_000);
  assert.equal(canWin(later, 18_000_000), true);
});
