export function hourKey(now) { return Math.floor(now / 3_600_000); }
export function createHour(now, random = Math.random) {
  const hour = hourKey(now);
  return { hour, winAt: hour * 3_600_000 + Math.floor(random() * 3_600_000), claimed: false };
}
export function canWin(state, now) { return state.hour === hourKey(now) && !state.claimed && now >= state.winAt; }
export function remaining(now) { return Math.ceil(((hourKey(now) + 1) * 3_600_000 - now) / 1000); }
