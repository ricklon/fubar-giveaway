// Sources and artwork provenance are documented in data/README.md.
const asset = path => `${import.meta.env.BASE_URL}events/${path}`;
export const events = [
  {
    title: 'Sussex County Maker Fest',
    organizer: 'COME MAKE SOMETHING WITH US',
    description: 'Join us for robotics, hands-on activities, local makers, and arts at Ideal Farm & Garden Center. Free admission and fun for all ages.',
    details: 'October 3–4, 2026 · 10 AM–4 PM · 222 NJ-15, Lafayette Township, NJ',
    image: asset('maker-fest-2026.jpg'),
    imageAlt: 'Sussex County Maker Fest 2026 poster featuring a blue robot goat, makers, robotics, and event information.',
    theme: 'maker',
    links: [
      { label: 'Explore Maker Fest', url: 'https://sussexcountymakerfest.org/' },
      { label: 'View the full flyer', url: asset('maker-fest-2026.pdf') },
    ],
  },
  {
    title: 'Mechanical Mayhem Fall',
    organizer: 'GARDEN STATE COMBAT ROBOTICS LEAGUE',
    description: 'The Season 5 opener at Sussex County Maker Fest. Come discover combat robotics and meet the Garden State Combat Robotics League.',
    details: 'October 3–4, 2026 · Lafayette Township, NJ',
    image: asset('gscrl-trophies.jpg'),
    imageAlt: 'Red and blue GSCRL trophies for combat robotics competitors.',
    theme: 'robotics',
    links: [
      { label: 'Event details & registration', url: 'https://www.robotcombatevents.com/events/9596' },
      { label: 'Meet the league', url: 'https://gscrl.org/' },
    ],
  },
  {
    title: 'Keep making with FUBAR Labs',
    organizer: 'FAIR USE BUILDING AND RESEARCH',
    description: 'Meet a volunteer-run community of makers, hackers, and tinkerers. Explore workshops, electronics, combat robotics, and collaborative projects.',
    details: '1510B Jersey Ave · North Brunswick, NJ',
    image: '',
    imageAlt: '',
    theme: 'lab',
    links: [{ label: 'Discover FUBAR Labs', url: 'https://fubarlabs.org/' }],
  },
];
