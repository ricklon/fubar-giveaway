// Keep stable IDs when editing prizes: browser award history uses these IDs.
// Add new weekend prizes here, with photos under public/.
export const prizes = [
  {
    id: 'puzzle',
    name: 'FUBAR Puzzle',
    description: 'Fit the colorful pieces back into the tray.',
    image: 'puzzle/front.jpg',
    imageAlt: 'FUBAR puzzle tray with colorful hexagonal pieces',
    backImage: 'puzzle/back.jpg',
    backImageAlt: 'Blue back of the FUBAR puzzle with a yellow printed QR code',
  },
  {
    id: 'figure',
    name: 'Dummy 13 kit',
    description: 'Build a poseable figure with movable joints. Strike a pose!',
    image: 'prizes/poseable-figure.jpg',
    imageAlt: 'Yellow and blue poseable figure doing a handstand beside colorful parts',
  },
];
