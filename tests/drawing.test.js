import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundAt, newRound, restoreDrawing, canWin, nextPrize, claimPrize, remaining } from '../src/drawing.js';

const at = (hhmm, day = 3) => { const [h, m] = hhmm.split(':').map(Number); return new Date(2026, 9, day, h, m).getTime(); };
const prizeIds = ['puzzle', 'figure'];
const halfHourly = [{ from: '00:00', minutes: 30 }];

test('rounds are half hours aligned to the clock by default', () => {
  assert.deepEqual(roundAt(at('10:00'), halfHourly), { start: at('10:00'), end: at('10:30'), minutes: 30 });
  assert.deepEqual(roundAt(at('10:47'), halfHourly), { start: at('10:30'), end: at('11:00'), minutes: 30 });
});

test('later rules lengthen rounds, shortening the round that straddles the change', () => {
  const schedule = [{ from: '00:00', minutes: 30 }, { from: '14:00', minutes: 45 }, { from: '15:40', minutes: 60 }];
  assert.deepEqual(roundAt(at('13:59'), schedule), { start: at('13:30'), end: at('14:00'), minutes: 30 });
  assert.deepEqual(roundAt(at('14:50'), schedule), { start: at('14:45'), end: at('15:30'), minutes: 45 });
  assert.deepEqual(roundAt(at('15:35'), schedule), { start: at('15:30'), end: at('15:40'), minutes: 45 });
  assert.deepEqual(roundAt(at('15:40'), schedule), { start: at('15:40'), end: at('16:40'), minutes: 60 });
  assert.equal(roundAt(at('23:50'), schedule).end, at('00:00', 4));
});

test('times before the first rule use its length from midnight', () => {
  assert.deepEqual(roundAt(at('09:10'), [{ from: '10:00', minutes: 30 }]), { start: at('09:00'), end: at('09:30'), minutes: 30 });
});

test('the prize opens at a random moment inside the round and is won once', () => {
  const round = newRound(at('10:00'), halfHourly, () => .5);
  assert.equal(round.winAt, at('10:15'));
  assert.equal(canWin(round, at('10:15') - 1), false);
  const win = claimPrize(round, at('10:15'), prizeIds);
  assert.equal(win.prizeId, 'puzzle');
  assert.equal(claimPrize(win.state, at('10:20'), prizeIds), null);
  assert.equal(remaining(win.state, at('10:29')), 60);
});

test('unclaimed prizes do not carry over; prizes alternate across rounds and days', () => {
  let state = restoreDrawing(null, at('10:00'), halfHourly, () => .9);
  state = restoreDrawing(state, at('10:31'), halfHourly, () => 0);
  assert.equal(state.roundStart, at('10:30'));
  assert.equal(nextPrize(state, prizeIds), 'puzzle');
  state = claimPrize(state, at('10:31'), prizeIds).state;
  state = restoreDrawing(state, at('10:00', 4), halfHourly, () => 0);
  assert.equal(state.claimed, false);
  assert.equal(claimPrize(state, at('10:00', 4), prizeIds).prizeId, 'figure');
});

test('refresh keeps the hidden moment within a round', () => {
  const round = newRound(at('10:00'), halfHourly, () => .5);
  assert.deepEqual(restoreDrawing(JSON.parse(JSON.stringify(round)), at('10:05'), halfHourly, () => { throw Error('must not reroll'); }), round);
});

test('adding a prize puts it into the rotation', () => {
  const state = { ...newRound(at('10:00'), halfHourly, () => 0), lastPrizeId: 'figure' };
  assert.equal(nextPrize(state, [...prizeIds, 'weekend-prize']), 'weekend-prize');
});
