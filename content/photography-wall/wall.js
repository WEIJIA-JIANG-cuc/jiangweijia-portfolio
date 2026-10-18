import { photos, pickColumns, columnFactor, layoutColumns } from './wall-data.js';

// Native DriftWall from portfolio 1.0; no React, CDNs or original-file preloading.
const container = document.getElementById('driftwall');
const plane = document.getElementById('dwPlane');
const lightbox = document.getElementById('lightbox');
const fullImage = document.getElementById('lightbox-image');
const closeButton = document.getElementById('lightbox-close');
const error = document.getElementById('lightbox-error');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const GAP = 14, SPEED = 38, VARIANCE = .5;
let reduced = motion.matches;
let colData = [], tracks = [], offsets = [], velocities = [];
let hoveredTile = null, focusedTile = null, returnTile = null;
let pointer = { x: 0, y: 0 }, damped = { x: 0, y: 0 };
let lastTs = null, raf = null, currentColumns = 0, tileWidth = 190, viewportHeight = 0;
container.style.setProperty('--dw-gap', GAP + 'px');
container.style.setProperty('--dw-radius', '14px');
container.style.setProperty('--dw-lift', '72px');

function assetURL(folder, path) {
  return new URL(folder + encodeURIComponent(path), import.meta.url).href;
}

function stop() {
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null;
  lastTs = null;
}

function start() {
  if (!reduced && !document.hidden && !lightbox.open && raf === null) raf = requestAnimationFrame(loop);
}

function build() {
  stop();
  hoveredTile = focusedTile = null;
  container.classList.toggle('is-reduced', reduced);
  currentColumns = pickColumns(container.clientWidth);
  tileWidth = Math.min(190, (container.clientWidth - 24) / currentColumns - GAP);
  container.style.setProperty('--dw-tw', tileWidth + 'px');
  viewportHeight = container.clientHeight;
  plane.style.height = viewportHeight * 1.8 + 'px';
  colData = layoutColumns(photos, currentColumns, tileWidth, GAP, container.clientHeight);
  tracks = [];
  plane.replaceChildren();
  colData.forEach((column, columnIndex) => {
    const col = document.createElement('div');
    col.className = 'dw-col';
    const track = document.createElement('div');
    track.className = 'dw-track';
    for (let copy = 0; copy < (reduced ? 1 : column.copies); copy++) {
      for (const { photo, height } of column.items) {
        const tile = document.createElement('button');
        tile.className = 'dw-tile';
        tile.type = 'button';
        tile.dataset.col = columnIndex;
        tile.dataset.path = photo.path;
        tile.setAttribute('aria-label', photo.alt + '，查看原图');
        // Repeated tracks are visual repetitions; keyboard navigation visits the original selection once.
        if (copy > 0) tile.tabIndex = -1;
        tile.style.height = height + GAP + 'px';
        const inner = document.createElement('span');
        inner.className = 'dw-inner';
        const image = document.createElement('img');
        image.src = assetURL('./previews/', photo.path);
        image.alt = photo.alt;
        image.width = photo.width;
        image.height = photo.height;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.draggable = false;
        inner.append(image);
        tile.append(inner);
        track.append(tile);
      }
    }
    col.append(track);
    plane.append(col);
    tracks.push(track);
  });
  offsets = colData.map((column, index) => column.repeatHeight * ((index * .37) % 1));
  velocities = colData.map(() => 0);
  damped = { x: 0, y: 0 };
  paint();
  start();
}

function paint() {
  if (reduced) return;
  plane.style.transform = 'translate(-50%,-50%) scale(1.18) rotateX(' + (14 + damped.y) + 'deg) rotateY(' + (-12 + damped.x) + 'deg) translateZ(-140px)';
  tracks.forEach((track, index) => { track.style.transform = 'translate3d(0,' + -offsets[index] + 'px,0)'; });
}

function loop(ts) {
  raf = null;
  if (reduced || document.hidden || lightbox.open) return;
  const dt = lastTs === null ? 0 : Math.min(.05, Math.max(0, (ts - lastTs) / 1000));
  lastTs = ts;
  const damping = 1 - Math.exp(-dt / .12);
  damped.x += (pointer.x * .7 * 8 - damped.x) * damping;
  damped.y += (-pointer.y * .7 * 8 - damped.y) * damping;
  colData.forEach((column, index) => {
    const paused = Number(hoveredTile?.dataset.col) === index || Number(focusedTile?.dataset.col) === index;
    if (paused) { velocities[index] = 0; return; }
    const target = SPEED * columnFactor(index, VARIANCE) * (index % 2 === 0 ? 1 : -1);
    velocities[index] += (target - velocities[index]) * (1 - Math.exp(-dt / .28));
    const next = offsets[index] + velocities[index] * dt;
    offsets[index] = ((next % column.repeatHeight) + column.repeatHeight) % column.repeatHeight;
  });
  paint();
  start();
}

function highlight() {
  plane.querySelectorAll('.is-active').forEach(tile => tile.classList.remove('is-active'));
  hoveredTile?.classList.add('is-active');
  focusedTile?.classList.add('is-active');
}

container.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  const bounds = container.getBoundingClientRect();
  if (!reduced) pointer = { x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5 };
  hoveredTile = event.target.closest('.dw-tile');
  highlight();
});
container.addEventListener('pointerleave', () => {
  hoveredTile = null;
  pointer = { x: 0, y: 0 };
  highlight();
});
container.addEventListener('focusin', event => {
  focusedTile = event.target.closest('.dw-tile');
  if (focusedTile && !reduced) {
    const col = Number(focusedTile.dataset.col);
    offsets[col] = focusedTile.offsetTop - plane.clientHeight / 2 + focusedTile.clientHeight / 2;
    velocities[col] = 0;
    paint();
  }
  highlight();
});
container.addEventListener('focusout', () => { focusedTile = null; highlight(); });
container.addEventListener('click', event => {
  const tile = event.target.closest('.dw-tile');
  if (tile) openLightbox(tile);
});
// Native buttons provide Enter and Space activation, including touch-generated clicks.
function openLightbox(tile) {
  returnTile = tile;
  const photo = photos.find(item => item.path === tile.dataset.path);
  error.hidden = true;
  fullImage.hidden = false;
  fullImage.alt = photo.alt;
  fullImage.src = assetURL('../photography/', photo.path);
  stop();
  lightbox.showModal();
  closeButton.focus();
}
fullImage.addEventListener('error', () => { fullImage.hidden = true; error.hidden = false; });
function closeLightbox() { if (lightbox.open) lightbox.close(); }
closeButton.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
lightbox.addEventListener('cancel', event => { event.preventDefault(); event.stopPropagation(); closeLightbox(); });
lightbox.addEventListener('close', () => {
  fullImage.removeAttribute('src');
  if (returnTile?.isConnected) returnTile.focus({ preventScroll: true });
  start();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  if (lightbox.open) closeLightbox();
  else window.parent.postMessage({ type: 'portfolio-close' }, location.origin);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
window.addEventListener('pagehide', stop);
motion.addEventListener('change', event => { reduced = event.matches; build(); });
new ResizeObserver(() => {
  const nextWidth = Math.min(190, (container.clientWidth - 24) / pickColumns(container.clientWidth) - GAP);
  if (pickColumns(container.clientWidth) !== currentColumns || Math.abs(nextWidth - tileWidth) > .5 || Math.abs(viewportHeight - container.clientHeight) > 1) build();
}).observe(container);
window.photoWallQA = () => ({
  cols: currentColumns, offsets: [...offsets], imageCount: photos.length,
  lightbox: lightbox.open, reduced, running: raf !== null,
  hoveredCol: hoveredTile ? Number(hoveredTile.dataset.col) : -1,
  focusedCol: focusedTile ? Number(focusedTile.dataset.col) : -1,
});
build();
