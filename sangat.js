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
const snapshotKey='gb-sangat-last-live-v1';
// Public viewers retain the last received Gurbani during temporary internet outages.
try {
  const saved=JSON.parse(localStorage.getItem(snapshotKey)||'null');
  if(saved&&saved.content&&typeof saved.content==='object'){
    content=saved.content;
    revision=saved.revision;
    render(content);
  }
} catch (_) {}
// Internet-based public viewing with no login, pairing or editing controls.
// PeerJS is an independent fallback for an unavailable hosted live service.
const broadcasterId='gurbani-sangat-public-v1';
let viewerPeer=null,liveChannel=null,lastPeerAt=0;
function acceptLive(packet){
  if(!packet||packet.type!=='sangat-live'||!Number.isFinite(packet.revision))return;
  const next=packet.content;
  if(next!==null&&(typeof next!=='object'||!Array.isArray(next.bookLines)||
      next.bookLines.length>400||next.bookLines.some(v=>typeof v!=='string'||v.length>500)))return;
  lastPeerAt=Date.now();
  revision='peer-'+String(packet.revision);
  content=next;
  render(content);
  try{localStorage.setItem(snapshotKey,JSON.stringify({revision,content}))}catch(_){}
  setLive(true);
}
function connectPublic(){
  if(!viewerPeer?.open||viewerPeer.disconnected||liveChannel&&!liveChannel.destroyed)return;
  try{
    const c=viewerPeer.connect(broadcasterId,{reliable:true,metadata:{type:'sangat-view-read-only'}});
    liveChannel=c;
    c.on('open',()=>{if(c===liveChannel)c.send({type:'sangat-join'})});
    c.on('data',acceptLive);
    const drop=()=>{if(liveChannel===c){liveChannel=null;setLive(false)}};
    c.on('close',drop);
    c.on('error',()=>{drop();c.close()});
    setTimeout(()=>{if(liveChannel===c&&!c.open){drop();c.close()}},12000);
  }catch(_){}
}
if(window.GurbaniPeer&&typeof window.Peer==='function'){
  window.GurbaniPeer.start({
    id:()=>{
      const bytes=crypto.getRandomValues(new Uint8Array(12));
      return 'gurbani-sangat-view-'+Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
    },
    onPeer:p=>{viewerPeer=p},
    onOpen:connectPublic,
    onConnection:c=>c.close(),
    onCollision:()=>{},
    onTargetUnavailable:()=>{},
    onStatus:()=>{}
  });
  setInterval(()=>{if(!document.hidden)connectPublic()},5000);
}
function setLive(online) {
  const activePeer=liveChannel?.open&&Date.now()-lastPeerAt<45000;
  const live=online||activePeer;
  status.dataset.live=String(live&&!!content);
  status.textContent=live?(content?'● ਲਾਈਵ':'ਉਡੀਕ ਜਾਰੀ ਹੈ'):'ਦੁਬਾਰਾ ਜੁੜ ਰਹੇ ਹਾਂ…';
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
      // Prefer active Internet live updates over an older hosted snapshot.
      if(Date.now()-lastPeerAt>45000&&revision!==packet.revision){
        revision=packet.revision;
        content=packet.content;
        render(content);
        try{localStorage.setItem(snapshotKey,JSON.stringify({revision,content}))}catch(_){}
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
