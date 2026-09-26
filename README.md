# FUBAR Labs · Robocon giveaway

An animated, responsive booth giveaway prototype. Run `npm install` and `npm run dev`. Use `npm run build` for a static production build and `npm test` for drawing rules.

Visitors see both prize photos and names under **You could win** before spinning. Select either prize to view its details; demo spins use the selected prize, while live spins follow the scheduled rotation shown above the reels. Visitors spin three reels for a FUBAR Puzzle or Dummy 13 kit. The first winning moment is randomly chosen within the clock hour. After an actual winning spin, the next prize becomes eligible 30 minutes later; the first visitor to spin after that time wins. Prize types alternate, including across hour boundaries, with at most one of each type awarded per hour. A quiet booth can make the gap longer. Unclaimed hourly prizes do not accumulate. Keep the winning screen visible and have booth staff hand out the prize. Booth controls let you select either prize for a guaranteed demo preview without consuming a prize.

State is stored locally in this browser, with Web Locks coordinating tabs where supported. This is a single-device prototype, not a secure raffle service: clearing or editing browser storage, changing the clock, or using another device can bypass the limit. A shared giveaway needs server-side award tracking and staff redemption. Live play is disabled when local storage is unavailable.

The UI uses SVG illustrations and CSS reel animation, with reduced-motion support. Prize photos are bundled locally; no animation libraries are required. Fonts load from Google Fonts with local fallbacks. Event year is currently 2026; event hours are not configured. Prize types are configured in `src/prizes.js`.

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

Selected promotional and prize assets under `public/` are committed. Raw `data/` artwork and `references/` are excluded, apart from the source notes in `data/README.md`.

Winning-spin timestamps, prize order, and hourly claims persist across refreshes. A puzzle won at 1:50 makes the Dummy 13 kit eligible at 2:20. Existing puzzle claims migrate automatically; old claims without timestamps conservatively use the end of their claimed hour for the gap. Each award is counted when the spin begins, before the host reveals it.

## Adding weekend prizes

Add the supplied photo under `public/prizes/`, then add an entry to `src/prizes.js` with a unique stable `id`, `name`, `description`, `image`, and `imageAlt`. Optional `backImage` and `backImageAlt` enable a flip view. Keep existing IDs unchanged to preserve award history. Catalog order sets the rotation; adding more prizes keeps the global 30-minute gap, so each individual prize comes around less often. Rebuild and restart the booth after changes. Preview each prize using Booth controls → Prize to preview → Preview a winning spin.

## Kiosk and member interaction

Click **Enter kiosk** for a simplified, fullscreen booth display. `?kiosk=1` opens the layout directly; browsers still require a click or F11 to enter fullscreen. **Exit kiosk** restores the full page. Escape can exit browser fullscreen; kiosk layout remains active until you exit it.

- **Space** starts an available spin, reveals the story’s result, and closes the result for the next visitor. Release and press again for each action; holding it does not skip steps.
- **Enter** also advances the story and closes the result. Buttons support mouse and touch.
- After a non-winning spin, kiosk mode thanks the visitor and invites a conversation; the host advances when ready. There is no timed dismissal or forced retry.
- The per-prize hourly limit and 30-minute separation still apply. The public review build stays in demo mode.

Before the event, set the booth computer not to sleep during the session and rehearse at the actual screen distance. Keep a physical puzzle available to talk about, and introduce the volunteer hosting the booth. Short stories from the members who printed or designed a piece will be more useful than more promotional copy.

Browser checks: `npx playwright install chromium`, then `npm run test:e2e`. Tests cover fullscreen, keyboard play, a held Space key, non-winning and winning flows, demo prize isolation, and common kiosk screen sizes.
