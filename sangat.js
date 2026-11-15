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

const settingKey='gb-sangat-viewer-settings-v2';
const defaults={sg:true,sh:false,se:false,mp:false,mh:false,me:false,lari:false,day:false};
let viewerSettings={...defaults};
try{const saved=JSON.parse(localStorage.getItem(settingKey)||'null');if(saved&&typeof saved==='object')for(const key of Object.keys(defaults))if(typeof saved[key]==='boolean')viewerSettings[key]=saved[key]}catch(_){}
const fields=['sg','sh','se','mp','mh','me'];
const menuButton=document.getElementById('sangatMenuButton');
const menu=document.getElementById('sangatSettings');
function refreshAppearance(){
 document.documentElement.classList.toggle('sangat-day',viewerSettings.day);
 document.documentElement.classList.toggle('sangat-larivaar',viewerSettings.lari);
 for(const checkbox of menu.querySelectorAll('[data-field]'))checkbox.checked=!!viewerSettings[checkbox.dataset.field];
 document.getElementById('sangatDay').checked=viewerSettings.day;
 document.getElementById('sangatLari').checked=viewerSettings.lari;
}
function updateViewerSettings(key,value){
 viewerSettings[key]=value;
 try{localStorage.setItem(settingKey,JSON.stringify(viewerSettings))}catch(_){}
 refreshAppearance();render(content);
}
menuButton.onclick=()=>{menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden))};
document.getElementById('sangatClose').onclick=()=>{menu.hidden=true;menuButton.setAttribute('aria-expanded','false')};
for(const checkbox of menu.querySelectorAll('[data-field]'))checkbox.onchange=()=>updateViewerSettings(checkbox.dataset.field,checkbox.checked);
document.getElementById('sangatDay').onchange=e=>updateViewerSettings('day',e.target.checked);
document.getElementById('sangatLari').onchange=e=>updateViewerSettings('lari',e.target.checked);
refreshAppearance();
function applyLadisaar(input){return viewerSettings.lari?String(input||'').replace(/\\s+/gu,''):String(input||'')}
function textRow(fragment,kind,text){
 if(!text)return;
 const node=document.createElement('span');
 node.className=kind;
 node.textContent=kind==='searcher-verse'?applyLadisaar(text):String(text);
 fragment.append(node);
}
let displayed = [];
let highlighted = null;
function render(content) {
 const blessing=content?.mode==='waheguru';
 const rows=(!blessing&&content)?(Array.isArray(content.bookLines)&&content.bookLines.length?content.bookLines:(content.verse?[content.verse]:[])):[];
 const detailsByLine=Array.isArray(content?.lineData)?content.lineData:[];
 waiting.hidden=!!(blessing||rows.length);
 waheguru.hidden=!blessing;
 details.textContent=[content?.shabadTitle,content?.ang?'ਅੰਗ '+content.ang:''].filter(Boolean).join(' · ');
 details.hidden=!details.textContent;
 // Viewer controls only presentation; no event sends a message to Control.
 const selected=Math.max(0,Math.min(rows.length-1,Number(content?.activeIndex)||0));
 const fragment=document.createDocumentFragment();
 rows.forEach((row,i)=>{
  const card=document.createElement('div');
  card.className='searcher-line';
  const data=detailsByLine[i]||{};
  const languages=data.scripts||{};
  const meanings=data.meanings||{};
  const fallback=String(row||'');
  if(viewerSettings.sg)textRow(card,'searcher-verse',languages.gurmukhi||fallback);
  if(viewerSettings.sh)textRow(card,'sangat-translation',languages.hindi||(i===selected?content?.scripts?.hindi:''));
  if(viewerSettings.se)textRow(card,'sangat-translation',languages.english||(i===selected?content?.scripts?.english:''));
  if(viewerSettings.mp)textRow(card,'sangat-meaning',meanings.punjabi||(i===selected?content?.meanings?.punjabi:''));
  if(viewerSettings.mh)textRow(card,'sangat-meaning',meanings.hindi||(i===selected?content?.meanings?.hindi:''));
  if(viewerSettings.me)textRow(card,'sangat-meaning',meanings.english||(i===selected?content?.meanings?.english:''));
  if(!card.childNodes.length)textRow(card,'searcher-verse',fallback);
  fragment.append(card);
 });
 lines.replaceChildren(fragment);
 displayed=rows;
 highlighted=lines.children[selected]||null;
 highlighted?.classList.add('active');
 highlighted?.setAttribute('aria-current','true');
 if(highlighted)motion.center(highlighted);
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
