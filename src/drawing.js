const MINUTE = 60_000;

function localTime(now, hhmm, dayOffset = 0) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

// The round containing `now`. Rounds are aligned to their rule's start time; the
// last round before a rule change is shortened so it ends when the next rule starts.
export function roundAt(now, schedule) {
  const rules = schedule.map(rule => ({ start: localTime(now, rule.from), minutes: rule.minutes }))
    .sort((a, b) => a.start - b.start);
  const index = rules.findLastIndex(rule => rule.start <= now);
  const rule = index < 0 ? { start: localTime(now, '00:00'), minutes: rules[0].minutes } : rules[index];
  const ruleEnd = index + 1 < rules.length ? rules[index + 1].start : localTime(now, '00:00', 1);
  const length = rule.minutes * MINUTE;
  const start = rule.start + Math.floor((now - rule.start) / length) * length;
  return { start, end: Math.min(start + length, ruleEnd), minutes: rule.minutes };
}

export function newRound(now, schedule, random = Math.random, lastPrizeId = null) {
  const { start, end } = roundAt(now, schedule);
  return { roundStart: start, roundEnd: end, winAt: start + Math.floor(random() * (end - start)), claimed: false, lastPrizeId };
}

// Keep the saved round (and its hidden winning moment) until it ends, so a refresh
// cannot reroll it. The prize rotation carries over between rounds and days.
export function restoreDrawing(saved, now, schedule, random = Math.random) {
  const lastPrizeId = typeof saved?.lastPrizeId === 'string' ? saved.lastPrizeId : null;
  const valid = saved && Number.isFinite(saved.roundStart) && Number.isFinite(saved.roundEnd)
    && Number.isFinite(saved.winAt) && typeof saved.claimed === 'boolean';
  if (valid && now >= saved.roundStart && now < saved.roundEnd) {
    return { roundStart: saved.roundStart, roundEnd: saved.roundEnd, winAt: saved.winAt, claimed: saved.claimed, lastPrizeId };
  }
  return newRound(now, schedule, random, lastPrizeId);
}

export function canWin(state, now) {
  return !state.claimed && now >= state.winAt && now >= state.roundStart && now < state.roundEnd;
}

export function nextPrize(state, prizeIds) {
  return prizeIds[(prizeIds.indexOf(state.lastPrizeId) + 1) % prizeIds.length];
}

export function claimPrize(state, now, prizeIds) {
  if (!canWin(state, now)) return null;
  const prizeId = nextPrize(state, prizeIds);
  return { prizeId, state: { ...state, claimed: true, lastPrizeId: prizeId } };
}

export function remaining(state, now) { return Math.max(0, Math.ceil((state.roundEnd - now) / 1000)); }
