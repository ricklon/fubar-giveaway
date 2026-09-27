// Giveaway rounds, in the booth laptop's local time. Each rule applies from its
// start time until the next rule starts (or midnight). One prize is hidden at a
// random moment in every round; the first spin at or after that moment wins it.
// To slow the giveaway later in the day, add a rule with longer rounds, e.g.
//   { from: '14:00', minutes: 45 },
//   { from: '15:30', minutes: 60 },
// Rebuild and restart the booth after changes.
export const schedule = [
  { from: '00:00', minutes: 30 },
];
