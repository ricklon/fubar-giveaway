import { restoreDrawing, roundAt, nextPrize, claimPrize, remaining } from './drawing.js';
import { schedule } from './schedule.js';
import { events } from './events.js';
import { prizes } from './prizes.js';
const prizeIds = prizes.map(prize => prize.id);
const prizeById = id => prizes.find(prize => prize.id === id) || prizes[0];
const asset = path => `${import.meta.env.BASE_URL}${path}`;
const prizePhoto = prize => `<img class="puzzle-photo" src="${asset(prize.image)}" alt="${prize.imageAlt}" />`;
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
let featuredPrizeId;
let selectedPrizeId = null;
function featurePrize(prize) {
  if (featuredPrizeId === prize.id) return;
  featuredPrizeId = prize.id;
  document.querySelectorAll('#prize-options button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.prizeId === prize.id));
  });
  $('.prize-detail h3').textContent = prize.name;
  $('.prize-detail p').textContent = prize.description;
  $('#hero-puzzle').innerHTML = prize.backImage
    ? `<button id="flip-puzzle" class="flip-puzzle" aria-label="Show the back of the puzzle">${prizePhoto(prize)}<span>See the back ↻</span></button>`
    : `<div class="featured-photo">${prizePhoto(prize)}</div>`;
  const flip = $('#flip-puzzle');
  if (flip) {
    let back = false;
    flip.addEventListener('click', () => {
      back = !back;
      flip.querySelector('img').src = asset(back ? prize.backImage : prize.image);
      flip.querySelector('img').alt = back ? prize.backImageAlt : prize.imageAlt;
      flip.setAttribute('aria-label', `Show the ${back ? 'front' : 'back'} of the puzzle`);
      flip.querySelector('span').textContent = `See the ${back ? 'front' : 'back'} ↻`;
    });
  }
}
$('#prize-lineup').textContent = 'Select a prize to see its photo and details.';
$('#prize-options').replaceChildren(...prizes.map(prize => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.prizeId = prize.id;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `${prizePhoto(prize)}<span>${prize.name}</span>`;
  button.addEventListener('click', () => {
    if (busy) return;
    selectedPrizeId = prize.id;
    $('#preview-prize').value = prize.id;
    updateStatus();
  });
  return button;
}));
$('#preview-prize').replaceChildren(...prizes.map(prize => {
  const option = document.createElement('option');
  option.value = prize.id;
  option.textContent = prize.name;
  return option;
}));
const reels = [0,1,2].map(i => $(`#reel-${i}`));
reels.forEach((reel, i) => { reel.innerHTML = icons[i]; });
const storageKey = 'fubar-giveaway-rounds-v2';
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
function readRound() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    state = restoreDrawing(saved, Date.now(), schedule, () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296);
    if (JSON.stringify(saved) !== JSON.stringify(state)) localStorage.setItem(storageKey, JSON.stringify(state));
  } catch { storageOk = false; }
}
function updateStatus() {
  if (!busy) readRound();
  const next = state && nextPrize(state, prizeIds);
  const prize = prizeById(next);
  if (!busy) {
    featurePrize(prizeById(selectedPrizeId || next));
    const spinPrize = demo ? prizeById(selectedPrizeId || next) : prize;
    icons[0] = prizePhoto(spinPrize);
    $('.machine-title p').textContent = `This spin: ${spinPrize.name}. Match three prize photos.`;
    if (!$('.machine').classList.contains('winner')) reels[0].innerHTML = icons[0];
  }
  document.querySelectorAll('#prize-options button').forEach(button => { button.disabled = busy; });
  const seconds = state ? remaining(state, Date.now()) : 0;
  $('#countdown-label').textContent = 'NEXT ROUND IN';
  document.querySelectorAll('.round-length').forEach(el => { el.textContent = roundLength(roundAt(Date.now(), schedule).minutes); });
  $('#countdown').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
  $('#prize-status').textContent = demo ? `${prizeById(selectedPrizeId || next).name} selected · demo only` : !storageOk ? 'Storage unavailable — demo spins only' : state?.claimed ? `This round’s prize has been won! ${prize.name} is up for grabs next round` : `${prize.name} is up for grabs this round`;
  if (!busy) {
    // After a win, visitors keep spinning; nothing more can be won until the next round.
    $('#spin').disabled = !demo && !storageOk;
    $('#try-again').disabled = $('#spin').disabled;
    $('#spin span').textContent = demo ? 'TAKE A DEMO SPIN' : 'GIVE IT A SPIN';
  }
}
const roundLength = minutes => minutes === 30 ? 'every half hour' : minutes === 60 ? 'every hour' : `every ${minutes} minutes`;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const showDialog = $('#show-dialog');
showDialog.addEventListener('cancel', event => event.preventDefault());
// Ignore dismissals briefly so an eager extra Space press can't skip the screen.
const dismissDelay = 1200;
// After a non-win, hold the landed reels on screen before the story opens.
const resultHold = 2500;
// An unattended story returns to the machine on its own.
const storyIdle = 30000;
function openShow(idleMs) {
  const next = $('#show-next');
  next.disabled = true;
  showDialog.showModal();
  $('#show-title').focus();
  return new Promise(resolve => {
    const ready = setTimeout(() => { next.disabled = false; }, dismissDelay);
    const idle = idleMs && setTimeout(() => finish('idle'), idleMs);
    const onClick = () => finish('advance');
    function finish(how) {
      clearTimeout(ready);
      clearTimeout(idle);
      next.removeEventListener('click', onClick);
      next.disabled = false;
      showDialog.close();
      resolve(how);
    }
    next.addEventListener('click', onClick);
  });
}
async function tellStory(event, isDemo) {
  showDialog.classList.remove('celebration');
  $('#confetti').replaceChildren();
  $('#show-kicker').textContent = 'NO MATCH THIS TIME · A STORY FROM THE BOOTH';
  $('#show-title').textContent = event.title;
  $('#show-description').textContent = event.description;
  $('#show-details').textContent = event.details;
  $('#show-demo').hidden = !isDemo;
  $('#show-next').textContent = 'Spin again ↗';
  $('#show-hint').textContent = 'Press Space to spin again. Ask us about anything you see here.';
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
  return openShow(storyIdle);
}
async function celebrate(isDemo, prize) {
  showDialog.classList.add('celebration');
  $('#show-kicker').textContent = `${prize.name.toUpperCase()} WINNER`;
  $('#show-title').textContent = isDemo ? 'YEAH! That’s a winning spin!' : 'YEAH! You got the prize!';
  $('#show-description').textContent = isDemo ? 'This is the celebration your winner will see.' : `The ${prize.name} is yours. Let’s get that prize into your hands!`;
  $('#show-details').textContent = 'Thanks for spending a little of your day with us.';
  $('#show-demo').hidden = !isDemo;
  $('#show-art').innerHTML = `<div class="prize-photos${prize.backImage ? '' : ' single-prize'}"><figure>${prizePhoto(prize)}<figcaption>Your ${prize.name}</figcaption></figure>${prize.backImage ? `<figure><img src="${asset(prize.backImage)}" alt="${prize.backImageAlt}" /><figcaption>A little making on both sides.</figcaption></figure>` : ''}</div>`;
  $('#show-next').textContent = isDemo ? 'Finish preview ↗' : 'Prize handed over · next visitor ↗';
  $('#show-hint').textContent = 'The celebration stays here until the booth crew is ready.';
  $('#confetti').replaceChildren(...Array.from({ length: 65 }, (_, i) => {
    const piece = document.createElement('i');
    piece.style.cssText = `left:${Math.random()*100}%;--delay:${Math.random()*2}s;--drift:${Math.random()*200-100}px;background:${['#d5ef79','#ff905a','#8dc5ff','#ed89c7'][i%4]}`;
    return piece;
  }));
  await openShow();
  $('#confetti').replaceChildren();
}
async function spin(forceWin = false) {
  if (busy) return;
  busy = true;
  const isDemo = demo || forceWin;
  let won = false;
  let spinPrize;
  const claim = () => {
    readRound();
    if (!isDemo && !storageOk) return false;
    const spinAt = Date.now();
    spinPrize = prizeById(forceWin ? $('#preview-prize').value : isDemo && selectedPrizeId ? selectedPrizeId : state && nextPrize(state, prizeIds));
    const award = !isDemo && claimPrize(state, spinAt, prizeIds);
    won = forceWin || !!award;
    if (won && !isDemo) {
      state = award.state;
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { storageOk = false; return false; }
    }
    return true;
  };
  const allowed = navigator.locks ? await navigator.locks.request(storageKey, claim) : claim();
  if (!allowed) { busy = false; updateStatus(); return; }
  if (isDemo) selectedPrizeId = spinPrize.id;
  featurePrize(spinPrize);
  icons[0] = prizePhoto(spinPrize);
  document.querySelectorAll('#prize-options button').forEach(button => { button.disabled = true; });
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
  const outcome = won ? [0,0,0] : [Math.floor(Math.random()*3), Math.floor(Math.random()*3), 1 + Math.floor(Math.random()*2)];
  for (let i=0; i<3; i++) { reels[i].classList.remove('spinning'); reels[i].innerHTML = icons[outcome[i]]; await pause(230); }
  clearInterval(ticker);
  if (won) $('.machine').classList.add('winner');
  $('#result').textContent = won ? isDemo ? 'That’s a winning match! Demo only — no prize awarded.' : `You won the ${spinPrize.name}! We’ll help you collect it.` : isDemo ? 'Practice spin complete. Here’s what visitors see after a non-winning spin.' : 'No match this time. Thanks for taking a turn—come talk making with us.';
  if (!won) {
    showEvent(storyIndex);
    $('#result').textContent += ` Check out ${events[displayedEvent].title} below.`;
  }
  $('#spin-note').textContent = 'No signup. No purchase. Just say hello.';
  let story;
  if (won) { await pause(600); await celebrate(isDemo, spinPrize); }
  else if (document.body.classList.contains('kiosk')) { await pause(resultHold); story = await tellStory(events[storyIndex], isDemo); }
  busy = false;
  updateStatus();
  $('#spin').focus({ preventScroll: true });
  // Space on the story is the next visitor's spin.
  if (story === 'advance' && !$('#spin').disabled) spin();
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
    // Both keys advance; repeated keydown events are ignored above.
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
