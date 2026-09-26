export const MIN_WIN_GAP = 30 * 60 * 1000;
const HOUR = 3_600_000;
export function hourKey(now) { return Math.floor(now / HOUR); }
export function createHour(now, random = Math.random, lastWinAt = null) {
  const hour = hourKey(now);
  const start = Math.max(hour * HOUR, lastWinAt === null ? 0 : lastWinAt + MIN_WIN_GAP);
  const end = (hour + 1) * HOUR;
  return { hour, winAt: start < end ? start + Math.floor(random() * (end - start)) : start, claimed: false, lastWinAt };
}
export function restoreHour(saved, now, random = Math.random) {
  const valid = saved && Number.isInteger(saved.hour) && Number.isFinite(saved.winAt) && typeof saved.claimed === 'boolean';
  if (!valid) return createHour(now, random);
  // Older builds did not save actual win times. Use the end of the claimed
  // hour conservatively so upgrading cannot shorten the minimum gap.
  const lastWinAt = Number.isFinite(saved.lastWinAt) ? saved.lastWinAt : saved.claimed ? (saved.hour + 1) * HOUR - 1 : null;
  if (saved.hour === hourKey(now)) {
    return { ...saved, lastWinAt, winAt: Math.max(saved.winAt, saved.hour * HOUR, lastWinAt === null ? 0 : lastWinAt + MIN_WIN_GAP) };
  }
  return createHour(now, random, lastWinAt);
}
export function canWin(state, now) {
  return state.hour === hourKey(now) && !state.claimed && now >= state.winAt && (state.lastWinAt === null || now >= state.lastWinAt + MIN_WIN_GAP);
}
export function remaining(now) { return Math.ceil(((hourKey(now) + 1) * HOUR - now) / 1000); }

// Retain the v1 fields/storage key so existing puzzle claims survive upgrades.
export function restoreDrawing(saved, now, prizeIds, random = Math.random) {
  const base = restoreHour(saved, now, random);
  const sameHour = saved?.hour === hourKey(now);
  const claimedPrizes = sameHour
    ? [...new Set(Array.isArray(saved.claimedPrizes) ? saved.claimedPrizes : saved.claimed ? ['puzzle'] : [])]
    : [];
  const lastPrizeId = saved?.lastPrizeId ?? (base.lastWinAt !== null ? 'puzzle' : null);
  // After the first award, the next prize opens exactly one minimum gap later.
  const winAt = base.lastWinAt === null ? base.winAt : Math.max(base.hour * HOUR, base.lastWinAt + MIN_WIN_GAP);
  return { ...base, winAt, claimedPrizes, lastPrizeId, claimed: prizeIds.every(id => claimedPrizes.includes(id)) };
}

export function nextPrize(state, prizeIds) {
  const start = (prizeIds.indexOf(state.lastPrizeId) + 1) % prizeIds.length;
  for (let offset = 0; offset < prizeIds.length; offset++) {
    const id = prizeIds[(start + offset) % prizeIds.length];
    if (!state.claimedPrizes.includes(id)) return id;
  }
  return null;
}

export function claimPrize(state, now, prizeIds) {
  const prizeId = nextPrize(state, prizeIds);
  if (!prizeId || !canWin(state, now)) return null;
  const claimedPrizes = [...state.claimedPrizes, prizeId];
  return {
    prizeId,
    state: { ...state, claimedPrizes, lastPrizeId: prizeId, lastWinAt: now,
      winAt: now + MIN_WIN_GAP, claimed: prizeIds.every(id => claimedPrizes.includes(id)) },
  };
}
