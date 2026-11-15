'use strict';

window.setupSangatPublisher = function (menu, currentContent) {
  const base = 'https://sangat-view-live.gamesplanet.chatgpt.site';
  const endpoint = base + '/live';
  const grantStorage = 'gb-sangat-control-approval';
  const publisherStorage = 'gb-sangat-publisher-key';
  let legacyKey = '';
  try { legacyKey = localStorage.getItem(publisherStorage) || ''; } catch (_) {}
  const panel = document.createElement('details');
  panel.innerHTML = '<summary>ਸੰਗਤ ਵਿਊ · Sangat View</summary>' +
    '<p role="status"></p><a class="sangat-enable" hidden>Enable on this Control</a> ' +
    '<a href="sangat.html" target="_blank" rel="noopener">Open Sangat View</a>';
  const message=panel.querySelector('p');
  const enable=panel.querySelector('.sangat-enable');
  if (!window.GurbaniUpdates) { enable.target='_blank'; enable.rel='noopener'; }
  menu.append(panel);

  function status(text) { message.textContent=text; }
  function showEnabled() {
    enable.hidden=true;
    status('Controller authorized. Public Sangat uses an internet live feed.');
  }
  function hex(bytes) { return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join(''); }
  let approval, claiming=false, claimTimer;
  async function prepareApproval() {
    if (legacyKey) { showEnabled(); return; }
    let secret=localStorage.getItem(grantStorage);
    if (!/^[a-f0-9]{64}$/.test(secret||'')) {
      secret=hex(crypto.getRandomValues(new Uint8Array(32)));
      localStorage.setItem(grantStorage,secret);
    }
    approval=secret;
    const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret));
    enable.href=base+'/owner?device='+hex(new Uint8Array(hash));
    enable.hidden=false;
    enable.onclick=()=>{localStorage.setItem(grantStorage+'-pending','1');claim()};
    status('Approve this Control once. Sangat View will then follow your selections.');
    if (localStorage.getItem(grantStorage+'-pending')==='1') claim();
  }
  async function claim() {
    if (!approval||legacyKey||claiming||document.hidden||localStorage.getItem(grantStorage+'-pending')!=='1') return;
    clearTimeout(claimTimer);
    claiming=true;
    try {
      const response=await fetch(base+'/claim',{method:'POST',headers:{'Content-Type':'application/json'},
        signal:AbortSignal.timeout?.(7000),body:JSON.stringify({secret:approval})});
      if (response.status===202) return;
      if (!response.ok) throw new Error('Approval unavailable');
      const result=await response.json();
      if (!/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(result.key)) throw new Error('Invalid approval');
      localStorage.setItem(publisherStorage,result.key);
      localStorage.removeItem(grantStorage+'-pending');
      legacyKey=result.key;
      showEnabled();
      send(currentContent());
    } catch (_) {
      status('Waiting for Control approval. Keep this screen open to retry.');
    } finally {
      claiming=false;
      if (!legacyKey&&!document.hidden) claimTimer=setTimeout(claim,1800);
    }
  }

  // Internet-only public read-only broadcast. This is a peer-to-peer fallback
  // when the hosted /live service is unavailable; no viewer login or code.
  const publicPeerId='gurbani-sangat-public-v1';
  const audience=new Set();
  let livePeer=null,latestSelection=null;
  function publicPacket() {
    return {type:'sangat-live',revision:Date.now(),content:latestSelection};
  }
  function broadcastPublic() {
    const packet=publicPacket();
    for(const channel of audience) {
      try {if(channel.open)channel.send(packet)}
      catch (_) {audience.delete(channel);try{channel.close()}catch (_) {}}
    }
  }
  if(window.GurbaniPeer&&typeof window.Peer==='function'){
    window.GurbaniPeer.start({
      id:()=>publicPeerId,
      onPeer:p=>{livePeer=p},
      onOpen:()=>{
        status('● Sangat public Internet broadcast ready');
        broadcastPublic();
      },
      onConnection:channel=>{
        // Viewers may only request the current public snapshot.
        if(audience.size>=100){channel.close();return}
        audience.add(channel);
        const drop=()=>audience.delete(channel);
        const snapshot=()=>{try{if(channel.open)channel.send(publicPacket())}catch (_) {drop()}};
        channel.on('open',snapshot);
        channel.on('data',message=>{if(message?.type==='sangat-join')snapshot()});
        channel.on('close',drop);
        channel.on('error',()=>{drop();channel.close()});
      },
      onCollision:()=>status('Another Control is already publishing Sangat View'),
      onTargetUnavailable:()=>{},
      onStatus:()=>{}
    });
  } else {
    status('Sangat Internet connection library unavailable');
  }

  let pending, publishing = false, timer;
  async function browserPublish() {
    if (publishing || pending === undefined) return;
    clearTimeout(timer);
    const packet = pending;
    pending = undefined;
    publishing = true;
    let delay = 0;
    try {
      const response = await fetch(endpoint, {
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:'Bearer ' + legacyKey},
        body:packet,
        signal:AbortSignal.timeout?.(9000),
      });
      if (response.status === 401) {
        legacyKey = '';
        localStorage.removeItem(publisherStorage);
        prepareApproval().catch(()=>status('Control approval is unavailable.'));

        return;
      }
      if (!response.ok) throw new Error('Broadcast unavailable');
      showEnabled();
      status('● Sangat live shabad published');
    } catch (_) {
      if (pending === undefined) pending = packet;
      delay = 3500;
      status('Sangat View reconnecting…');
    } finally {
      publishing = false;
      if (legacyKey && pending !== undefined) timer = setTimeout(browserPublish, delay);
    }
  }

  function send(content) {
    let selection = null;
    if (content) {
      const rows = Array.isArray(content.bookLines) ? content.bookLines : [];
      const index = Number.isInteger(content.activeIndex) ? content.activeIndex : 0;
      const first = Math.max(0, Math.min(index - 200, rows.length - 400));
      selection = {
        verse:String(content.verse || '').slice(0,8192), mode:content.mode,
        bookLines:rows.slice(first,first + 400).map(line => String(line).slice(0,500)),
        activeIndex:Math.max(0,index - first), ang:content.ang,
        shabadTitle:String(content.shabadTitle || '').slice(0,180),
      };
    }
    latestSelection=selection;
    broadcastPublic();
    if(legacyKey){
      const packet = JSON.stringify({content:selection});
      pending=packet;browserPublish();
    }
  }

  send(currentContent());
  if(legacyKey)showEnabled();
  else prepareApproval().catch(()=>status('Hosted Sangat approval unavailable; Internet fallback remains enabled.'));
  window.addEventListener('online',()=>{claim();if(legacyKey)browserPublish()});
  for(const name of ['pageshow','focus'])window.addEventListener(name,claim);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)claim()});
  return {send, active:()=>!!legacyKey};
};
