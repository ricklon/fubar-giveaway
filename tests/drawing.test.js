import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHour, canWin, remaining, restoreDrawing, nextPrize, claimPrize, MIN_WIN_GAP } from '../src/drawing.js';
test('award only at or after the chosen time, once in the matching hour', () => {
  const state = createHour(3_600_000, () => .5);
  assert.equal(canWin(state, 5_399_999), false);
  assert.equal(canWin(state, 5_400_000), true);
  assert.equal(canWin({...state, claimed:true}, 5_400_001), false);
  assert.equal(canWin(state, 7_200_000), false);
});

const prizeIds = ['puzzle', 'figure'];
test('puzzle and kit alternate with thirty minutes between actual wins', () => {
  const initial = restoreDrawing(null, 0, prizeIds, () => 0);
  const puzzle = claimPrize(initial, 5 * 60_000, prizeIds);
  assert.equal(puzzle.prizeId, 'puzzle');
  const restored = restoreDrawing(JSON.parse(JSON.stringify(puzzle.state)), 10 * 60_000, prizeIds);
  assert.equal(nextPrize(restored, prizeIds), 'figure');
  assert.equal(claimPrize(restored, 35 * 60_000 - 1, prizeIds), null);
  const kit = claimPrize(restored, 35 * 60_000, prizeIds);
  assert.equal(kit.prizeId, 'figure');
  assert.equal(kit.state.claimed, true);
  assert.equal(claimPrize(kit.state, 59 * 60_000, prizeIds), null);
  const nextHour = restoreDrawing(kit.state, 60 * 60_000, prizeIds);
  assert.equal(nextPrize(nextHour, prizeIds), 'puzzle');
  assert.equal(claimPrize(nextHour, 65 * 60_000 - 1, prizeIds), null);
  assert.equal(claimPrize(nextHour, 65 * 60_000, prizeIds).prizeId, 'puzzle');
});

test('late puzzle wins delay the kit into the next hour, including after refresh', () => {
  const initial = restoreDrawing(null, 0, prizeIds, () => 0);
  const puzzle = claimPrize(initial, 50 * 60_000, prizeIds);
  const nextHour = restoreDrawing(puzzle.state, 60 * 60_000, prizeIds);
  assert.equal(nextPrize(nextHour, prizeIds), 'figure');
  assert.equal(claimPrize(nextHour, 80 * 60_000 - 1, prizeIds), null);
  assert.equal(claimPrize(nextHour, 80 * 60_000, prizeIds).prizeId, 'figure');
});

test('existing puzzle claims migrate without awarding it again or shortening the gap', () => {
  const saved = { hour: 0, winAt: 0, claimed: true, lastWinAt: 10 * 60_000 };
  const state = restoreDrawing(saved, 15 * 60_000, prizeIds);
  assert.deepEqual(state.claimedPrizes, ['puzzle']);
  assert.equal(nextPrize(state, prizeIds), 'figure');
  assert.equal(state.winAt, saved.lastWinAt + MIN_WIN_GAP);
  const legacy = restoreDrawing({ hour: 0, winAt: 0, claimed: true }, 60 * 60_000, prizeIds);
  assert.equal(legacy.winAt, 90 * 60_000 - 1);
  assert.equal(nextPrize(legacy, prizeIds), 'figure');
});

test('adding a weekend prize preserves claims and includes it in the rotation', () => {
  let state = restoreDrawing(null, 0, prizeIds, () => 0);
  state = claimPrize(state, 0, prizeIds).state;
  state = claimPrize(state, MIN_WIN_GAP, prizeIds).state;
  const expanded = [...prizeIds, 'weekend-prize'];
  state = restoreDrawing(state, MIN_WIN_GAP + 1, expanded);
  assert.deepEqual(state.claimedPrizes, prizeIds);
  assert.equal(nextPrize(state, expanded), 'weekend-prize');
  assert.equal(canWin(state, MIN_WIN_GAP + 1), false);
  state = restoreDrawing(state, 2 * MIN_WIN_GAP, expanded);
  assert.equal(claimPrize(state, 2 * MIN_WIN_GAP, expanded).prizeId, 'weekend-prize');
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
