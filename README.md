# FUBAR Labs · Robocon giveaway

An animated, responsive booth giveaway prototype. Run `npm install` and `npm run dev`. Use `npm run build` for a static production build and `npm test` for drawing rules.

Visitors spin three reels. At the start of each clock hour, the browser chooses a random winning moment; the first spin after it wins the puzzle. Only one puzzle is awarded per hour; unclaimed prizes do not roll over. Keep the winning screen visible and have booth staff hand out the prize. Booth controls include demo spins and a guaranteed preview, neither of which consumes a prize.

State is stored locally in this browser, with Web Locks coordinating tabs where supported. This is a single-device prototype, not a secure raffle service: clearing or editing browser storage, changing the clock, or using another device can bypass the limit. A shared giveaway needs server-side award tracking and staff redemption. Live play is disabled when local storage is unavailable.

The UI uses SVG illustrations and CSS reel animation, with reduced-motion support. No image assets or animation libraries are required. Fonts load from Google Fonts with local fallbacks. Event year is currently 2026; event hours and additional prize types are not configured.

Non-winning spins rotate through Sussex County Maker Fest, Mechanical Mayhem Fall (GSCRL Season 5 opener), and FUBAR Labs. Visitors can explore another promotion or spin again. Demo spins preview the same invitations; winning spins keep the prize message. Event copy, dates, artwork, and official links live in `src/events.js`. Source provenance and known poster issues are documented in `data/README.md`.

## Browser-only hosting

Run `npm run build`, then upload the contents of `dist/` to a static website host. The booth only needs a browser pointed at that website; Node and npm are development/build tools, not booth requirements. Host over HTTPS. No backend or environment variables are required. Serve the built files over HTTP(S), rather than opening `index.html` with a file URL.

The build includes the selected poster, full flyer PDF, and trophy photo. Source PDFs and lanyards in `data/` stay out of the build. Fonts fall back locally if Google Fonts is unavailable. Initial loading requires network access; offline caching has not been implemented. Hourly prize state remains specific to the browser and website origin; multiple devices do not share the award limit.

## Running the booth

On this laptop, run `npm run booth` and open **http://localhost:4174**. Leave the terminal running; Ctrl+C stops it. This builds the app and serves its bundled images locally, so the booth experience works without venue internet once dependencies are installed. External promotional websites still need internet. Keep the same URL and browser for hourly prize tracking. Port 4174 is fixed to avoid silently moving to another origin; if occupied, stop the previous booth server before restarting.

Press F11 in the browser for a full-screen booth display. Each spin opens a large story/image panel. The booth host can talk for as long as needed, then press **Reveal the spin**. A non-winning result shows that promotion; a winner gets a confetti celebration that stays visible until the host presses **Prize handed over · next visitor**. The handover button dismisses the screen; the prize is already counted when the spin begins. A demo winning spin follows the complete flow without consuming a prize. No microphone, speech synthesis, or auto-playing audio is used.

## Member review on GitHub Pages

https://ricklon.github.io/fubar-giveaway/

Pushes to `main` automatically test, build, and publish through `.github/workflows/pages.yml`. Pages builds use `/fubar-giveaway/` as the asset base and `VITE_REVIEW_MODE=true` to keep all reviewer spins in demo mode. The page has a feedback link to repository Issues. Use Booth controls → Preview a winning spin to rehearse the celebration. Local `npm run booth` continues to support real awards.

Only the selected promotional assets under `public/events/` are committed. Raw `data/` artwork and `references/` are excluded, apart from the source notes in `data/README.md`.
