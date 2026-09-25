import { restoreHour, canWin, remaining } from './drawing.js';
import { events } from './events.js';
const $ = (selector) => document.querySelector(selector);
const puzzlePhoto = side => `${import.meta.env.BASE_URL}puzzle/${side}.jpg`;
const puzzleFront = `<img class="puzzle-photo" src="${puzzlePhoto('front')}" alt="FUBAR puzzle tray with colorful hexagonal pieces" />`;
let nextEvent = 0;
let displayedEvent = 0;
function showEvent(index) {
  displayedEvent = index;
  const event = events[index];
  $('#event-title').textContent = event.title;
  $('#event-organizer').textContent = event.organizer;
  $('#event-description').textContent = event.description;
  $('#event-details').textContent = event.details;
  $('#event-invitation').dataset.theme = event.theme;
  $('#event-links').replaceChildren(...event.links.map(({ label, url }) => {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = `${label} ↗`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }));
  const artwork = $('#event-artwork');
  artwork.hidden = !event.image;
  if (event.image) { artwork.src = event.image; artwork.alt = event.imageAlt; }
  else { artwork.removeAttribute('src'); artwork.alt = ''; }
  $('#event-invitation').hidden = false;
}
function puzzle(color = '#ed784e', dark = '#ba5031', light = '#ffa479') {
  return `<svg viewBox="0 0 180 180" aria-hidden="true"><defs><pattern id="lines-${color.slice(1)}" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h4" stroke="#402310" stroke-opacity=".1" stroke-width=".7"/></pattern></defs><path d="M29 63 88 29 151 65 92 100Z" fill="${light}"/><path d="M29 63v62l63 36v-61Z" fill="${color}"/><path d="m92 100 59-35v61l-59 35Z" fill="${dark}"/><path d="m49 52 63 36v61M70 40l62 36v61M29 83l63 36 59-35M29 104l63 36 59-35" fill="none" stroke="#743b25" stroke-opacity=".5" stroke-width="2"/><path d="m49 75 60-34M70 88l61-35M50 76v61M71 88v61" fill="none" stroke="#743b25" stroke-opacity=".5" stroke-width="2"/><path d="m29 63 59-34 63 36v61l-59 35-63-36Z" fill="url(#lines-${color.slice(1)})"/><path d="m74 72 14-8 15 8-15 9Z" fill="${dark}"/><path d="M74 72v10l14 9V81Z" fill="${color}"/><path d="m88 81 15-9v10l-15 9Z" fill="${dark}"/></svg>`;
}
const icons = [puzzle(), `<svg viewBox="0 0 180 180" aria-hidden="true"><path d="m90 25 19 41 45 5-33 31 9 45-40-22-40 22 8-45-33-31 46-5Z" fill="#b1c65f" stroke="#73853c" stroke-width="3"/><path d="m90 25 0 71 40 51-9-45 33-31-45-5Z" fill="#92aa47"/></svg>`, `<svg viewBox="0 0 180 180" aria-hidden="true"><rect x="35" y="56" width="110" height="88" rx="17" fill="#9298c8" stroke="#626898" stroke-width="3"/><path d="M90 56V34" stroke="#626898" stroke-width="7"/><circle cx="90" cy="29" r="9" fill="#bed376"/><rect x="49" y="72" width="82" height="41" rx="10" fill="#353e4c"/><circle cx="70" cy="92" r="7" fill="#d7ec8a"/><circle cx="110" cy="92" r="7" fill="#d7ec8a"/><path d="M73 128h34" stroke="#535979" stroke-width="5"/><path d="M23 84v33m134-33v33" stroke="#626898" stroke-width="10"/></svg>`];
icons[0] = puzzleFront;
let puzzleSide = 'front';
$('#hero-puzzle').innerHTML = `<button id="flip-puzzle" class="flip-puzzle" aria-label="Show the back of the puzzle">${puzzleFront}<span>See the back ↻</span></button>`;
$('#flip-puzzle').addEventListener('click', () => {
  puzzleSide = puzzleSide === 'front' ? 'back' : 'front';
  const button = $('#flip-puzzle');
  const img = button.querySelector('img');
  img.src = puzzlePhoto(puzzleSide);
  img.alt = puzzleSide === 'front' ? 'FUBAR puzzle tray with colorful hexagonal pieces' : 'Blue back of the FUBAR puzzle with a yellow printed QR code';
  const otherSide = puzzleSide === 'front' ? 'back' : 'front';
  button.setAttribute('aria-label', `Show the ${otherSide} of the puzzle`);
  button.querySelector('span').textContent = `See the ${otherSide} ↻`;
});
const reels = [0,1,2].map(i => $(`#reel-${i}`));
reels.forEach((reel, i) => { reel.innerHTML = icons[i]; });
const storageKey = 'fubar-hourly-drawing-v1';
let state;
let storageOk = true;
let busy = false;
const reviewMode = import.meta.env.VITE_REVIEW_MODE === 'true';
let demo = reviewMode;
$('#demo-mode').checked = demo;
if (reviewMode) {
  $('#demo-mode').disabled = true;
  $('#review-banner').hidden = false;
}
function readHour() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    state = restoreHour(saved, Date.now(), () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296);
    if (JSON.stringify(saved) !== JSON.stringify(state)) localStorage.setItem(storageKey, JSON.stringify(state));
  } catch { storageOk = false; }
}
function updateStatus() {
  if (!busy) readHour();
  const seconds = remaining(Date.now());
  $('#countdown').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  $('#prize-status').textContent = !storageOk ? 'Storage unavailable — demo spins only' : state?.claimed ? 'This hour’s puzzle has found its person!' : 'This hour’s puzzle is up for grabs';
  if (!busy) {
    $('#spin').disabled = !demo && (!storageOk || state?.claimed);
    $('#try-again').disabled = $('#spin').disabled;
    $('#spin span').textContent = demo ? 'TAKE A DEMO SPIN' : state?.claimed ? 'NEXT PUZZLE, NEXT HOUR' : 'GIVE IT A SPIN';
  }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const showDialog = $('#show-dialog');
showDialog.addEventListener('cancel', event => event.preventDefault());
function waitForHost() {
  return new Promise(resolve => $('#show-next').addEventListener('click', resolve, { once: true }));
}
async function tellStory(event, isDemo) {
  showDialog.classList.remove('celebration');
  $('#confetti').replaceChildren();
  $('#show-kicker').textContent = 'A STORY FROM THE BOOTH';
  $('#show-title').textContent = event.title;
  $('#show-description').textContent = event.description;
  $('#show-details').textContent = event.details;
  $('#show-demo').hidden = !isDemo;
  $('#show-next').textContent = 'Reveal the spin ↗';
  $('#show-hint').textContent = 'Booth host: tell the story, then press Enter to reveal the result.';
  const art = $('#show-art');
  art.replaceChildren();
  if (event.storyImage || event.image) {
    const img = document.createElement('img');
    img.src = event.storyImage || event.image;
    img.alt = event.storyImageAlt || event.imageAlt;
    img.addEventListener('error', () => { art.innerHTML = puzzle(); }, { once: true });
    art.append(img);
    if (event.photoCaption) {
      const caption = document.createElement('p');
      caption.className = 'photo-caption';
      caption.textContent = event.photoCaption;
      art.append(caption);
    }
  } else art.innerHTML = puzzleFront;
  showDialog.showModal();
  $('#show-title').focus();
  await waitForHost();
  showDialog.close();
}
async function celebrate(isDemo) {
  showDialog.classList.add('celebration');
  $('#show-kicker').textContent = 'THIS HOUR’S PUZZLE WINNER';
  $('#show-title').textContent = isDemo ? 'YEAH! That’s a winning spin!' : 'YEAH! You got the prize!';
  $('#show-description').textContent = isDemo ? 'This is the celebration your winner will see.' : 'This hour’s FUBAR puzzle is yours. Let’s get that prize into your hands!';
  $('#show-details').textContent = 'Thanks for spending a little of your day with us.';
  $('#show-demo').hidden = !isDemo;
  $('#show-art').innerHTML = `<div class="prize-photos"><figure>${puzzleFront}<figcaption>Your FUBAR puzzle</figcaption></figure><figure><img src="${puzzlePhoto('back')}" alt="Back of the puzzle with a printed QR code" /><figcaption>A little making on both sides.</figcaption></figure></div>`;
  $('#show-next').textContent = isDemo ? 'Finish preview ↗' : 'Prize handed over · next visitor ↗';
  $('#show-hint').textContent = 'The celebration stays here until the booth crew is ready.';
  $('#confetti').replaceChildren(...Array.from({ length: 65 }, (_, i) => {
    const piece = document.createElement('i');
    piece.style.cssText = `left:${Math.random()*100}%;--delay:${Math.random()*2}s;--drift:${Math.random()*200-100}px;background:${['#d5ef79','#ff905a','#8dc5ff','#ed89c7'][i%4]}`;
    return piece;
  }));
  showDialog.showModal();
  $('#show-title').focus();
  await waitForHost();
  showDialog.close();
  $('#confetti').replaceChildren();
}
async function spin(forceWin = false) {
  if (busy) return;
  busy = true;
  const isDemo = demo || forceWin;
  let won = false;
  const claim = () => {
    readHour();
    if (!isDemo && (!storageOk || state.claimed)) return false;
    const spinAt = Date.now();
    won = forceWin || (!isDemo && canWin(state, spinAt));
    if (won && !isDemo) {
      state.claimed = true;
      state.lastWinAt = spinAt;
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { storageOk = false; return false; }
    }
    return true;
  };
  const allowed = navigator.locks ? await navigator.locks.request(storageKey, claim) : claim();
  if (!allowed) { busy = false; updateStatus(); return; }
  $('.machine').classList.remove('winner');
  $('#event-invitation').hidden = true;
  $('#result').textContent = '';
  $('#spin').disabled = true;
  $('#spin span').textContent = 'SPINNING…';
  $('#spin-note').textContent = isDemo ? 'Demo spin · no prize will be awarded' : 'Let’s see what comes together.';
  reels.forEach(reel => reel.classList.add('spinning'));
  const ticker = setInterval(() => reels.forEach(reel => { if (reel.classList.contains('spinning')) reel.innerHTML = icons[Math.floor(Math.random()*3)]; }), 90);
  await pause(matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 1300);
  const storyIndex = nextEvent;
  nextEvent = (nextEvent + 1) % events.length;
  await tellStory(events[storyIndex], isDemo);
  const outcome = won ? [0,0,0] : [Math.floor(Math.random()*3), Math.floor(Math.random()*3), 1 + Math.floor(Math.random()*2)];
  for (let i=0; i<3; i++) { reels[i].classList.remove('spinning'); reels[i].innerHTML = icons[outcome[i]]; await pause(230); }
  clearInterval(ticker);
  if (won) $('.machine').classList.add('winner');
  $('#result').textContent = won ? isDemo ? 'That’s a winning match! Demo only — no prize awarded.' : 'You won this hour’s puzzle! We’ll help you collect it.' : isDemo ? 'Practice spin complete. Here’s what visitors see after a non-winning spin.' : 'No match this time. Thanks for taking a turn—come talk puzzles with us.';
  if (!won) {
    showEvent(storyIndex);
    $('#result').textContent += ` Check out ${events[displayedEvent].title} below.`;
  }
  $('#spin-note').textContent = 'No signup. No purchase. Just say hello.';
  if (won) await celebrate(isDemo);
  else if (document.body.classList.contains('kiosk')) await thankVisitor(isDemo);
  busy = false;
  updateStatus();
  $('#spin').focus({ preventScroll: true });
}
$('#spin').addEventListener('click', () => spin());
$('#try-again').addEventListener('click', () => { $('#spin').focus(); spin(); });
$('#other-event').addEventListener('click', () => showEvent((displayedEvent + 1) % events.length));
$('#event-artwork').addEventListener('error', () => { $('#event-artwork').hidden = true; });
$('#staff-open').addEventListener('click', () => $('#staff-dialog').showModal());
$('#demo-mode').addEventListener('change', event => { demo = event.target.checked; updateStatus(); });
$('#demo-win').addEventListener('click', () => { $('#staff-dialog').close(); spin(true); });
window.addEventListener('storage', updateStatus);
updateStatus();
setInterval(updateStatus, 1000);

async function thankVisitor(isDemo) {
  $('#show-kicker').textContent = 'THANKS FOR TAKING A TURN';
  $('#show-title').textContent = 'No match this time. Glad you stopped by.';
  $('#show-description').textContent = 'Want to see how the puzzle works? Ask us about the pieces, the printer, or something you’d like to make.';
  $('#show-details').textContent = 'You don’t have to win a prize to join the conversation.';
  $('#show-demo').hidden = !isDemo;
  $('#show-next').textContent = 'Ready for the next visitor';
  $('#show-hint').textContent = 'Booth host: press Enter when you’re ready.';
  showDialog.showModal();
  $('#show-title').focus();
  await waitForHost();
  showDialog.close();
}

function setKiosk(enabled) {
  document.body.classList.toggle('kiosk', enabled);
  $('#kiosk-toggle').setAttribute('aria-pressed', String(enabled));
  $('#kiosk-toggle').textContent = enabled ? 'Exit kiosk' : 'Enter kiosk';
  const url = new URL(location.href);
  if (enabled) url.searchParams.set('kiosk', '1');
  else url.searchParams.delete('kiosk');
  history.replaceState(null, '', url);
  window.scrollTo(0, 0);
}
$('#kiosk-toggle').addEventListener('click', async () => {
  const enabled = !document.body.classList.contains('kiosk');
  setKiosk(enabled);
  $('#kiosk-status').textContent = '';
  try {
    if (enabled && !document.fullscreenElement) await document.documentElement.requestFullscreen();
    else if (!enabled && document.fullscreenElement) await document.exitFullscreen();
  } catch {
    $('#kiosk-status').textContent = 'Kiosk layout is ready. Use your browser’s fullscreen control (usually F11) to fill the display.';
  }
  if (enabled) $('#spin').focus({ preventScroll: true });
});
if (new URLSearchParams(location.search).get('kiosk') === '1') setKiosk(true);

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
  if (event.code !== 'Space' && event.key !== 'Enter') return;
  if (event.repeat) { event.preventDefault(); return; }
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if ($('#staff-dialog').open) return;
  if (showDialog.open) {
    // A held spin key must never reveal or dismiss a visitor’s result.
    if (event.code === 'Space') { event.preventDefault(); return; }
    event.preventDefault();
    $('#show-next').click();
    return;
  }
  if (event.code === 'Space') {
    if (event.target.closest('button, a') && !event.target.closest('#spin')) return;
    event.preventDefault();
    if (!busy && !$('#spin').disabled) spin();
  }
});
