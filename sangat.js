'use strict';

const endpoint = 'https://sangat-view-live.gamesplanet.chatgpt.site/live';
const reader = document.getElementById('reader');
const lines = document.getElementById('lines');
const status = document.getElementById('liveStatus');
const details = document.getElementById('readingDetails');
const waiting = document.getElementById('waiting');
const waheguru = document.getElementById('waheguru');
const zoomKey = 'gb-sangat-font-size';
let size;
try {
  const saved = Number(localStorage.getItem(zoomKey));
  if (saved >= 14 && saved <= 85) previewSize(saved);
} catch (_) {}

function previewSize(value) {
  size = value;
  reader.style.setProperty('--searcher-font', value + 'px');
}
const motion = GurbaniBookMotion(reader, document.scrollingElement || document.documentElement,
  () => size || parseFloat(getComputedStyle(lines.firstElementChild || waheguru).fontSize) || 32,
  previewSize, () => { try { localStorage.setItem(zoomKey, String(size)); } catch (_) {} }
);

let displayed = [];
let highlighted = null;
function render(content) {
  const blessing = content?.mode === 'waheguru';
  const verses = !blessing && content ? content.bookLines?.length ? content.bookLines
    : content.verse ? [content.verse] : [] : [];
  waiting.hidden = !!(blessing || verses.length);
  waheguru.hidden = !blessing;
  details.textContent = [content?.shabadTitle, content?.ang ? 'ਅੰਗ ' + content.ang : '']
    .filter(Boolean).join(' · ');
  details.hidden = !details.textContent;
  if (verses.length !== displayed.length || verses.some((line, i) => line !== displayed[i])) {
    const fragment = document.createDocumentFragment();
    for (const text of verses) {
      const paragraph = document.createElement('div');
      paragraph.className = 'searcher-line';
      const verse = document.createElement('span');
      verse.className = 'searcher-verse';
      verse.textContent = text;
      paragraph.append(verse);
      fragment.append(paragraph);
    }
    lines.replaceChildren(fragment);
    displayed = verses;
    highlighted = null;
  }
  const active = lines.children[Math.max(0, Math.min(verses.length - 1, content?.activeIndex || 0))];
  if (active === highlighted) return;
  highlighted?.classList.remove('active');
  highlighted?.removeAttribute('aria-current');
  highlighted = active;
  active?.classList.add('active');
  active?.setAttribute('aria-current', 'true');
  motion.center(active);
}

let etag, revision, content = null, timer, loading = false;
function setLive(online) {
  status.dataset.live = String(online && !!content);
  status.textContent = online ? content ? '● ਲਾਈਵ' : 'ਉਡੀਕ ਜਾਰੀ ਹੈ' : 'ਦੁਬਾਰਾ ਜੁੜ ਰਹੇ ਹਾਂ…';
}
async function sync() {
  clearTimeout(timer);
  if (document.hidden || loading) return;
  loading = true;
  try {
    const response = await fetch(endpoint, {
      headers: etag ? {'If-None-Match':etag} : {}, signal:AbortSignal.timeout(9000),
    });
    if (response.status !== 304) {
      if (!response.ok) throw new Error('Live feed unavailable');
      const packet = await response.json();
      etag = response.headers.get('etag');
      if (revision !== packet.revision) {
        revision = packet.revision;
        content = packet.content;
        render(content);
      }
    }
    setLive(true);
  } catch (_) {
    setLive(false);
  } finally {
    loading = false;
    if (!document.hidden) timer = setTimeout(sync, 2100 + Math.random() * 1000);
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else sync(); });
window.addEventListener('online', sync);
sync();
