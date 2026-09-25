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
