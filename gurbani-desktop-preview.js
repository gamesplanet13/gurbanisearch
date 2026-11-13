/* Controller preview is opt-in and uses existing authenticated display connections. */
window.GurbaniDesktopPreview = function ({connections, known, cameraPhones, cameraStreams, send, token}) {
 const panel = document.getElementById('desktopPreview');
 const toggle = document.getElementById('desktopPreviewToggle');
 const select = document.getElementById('desktopPreviewSource');
 const image = document.getElementById('desktopPreviewImage');
 const video = document.getElementById('desktopPreviewVideo');
 const status = document.getElementById('desktopPreviewStatus');
 let active = false, subscription = null, waiting;

 function unsubscribe() {
  clearTimeout(waiting);
  if (subscription) send(subscription, {type:'screen-preview',token,enabled:false});
  subscription = null;
 }

 function showSource() {
  unsubscribe();
  image.hidden = true;
  image.removeAttribute('src');
  video.hidden = true;
  video.srcObject = null;
  if (!active) return;
  const [type, id] = select.value.split(':');
  if (type === 'camera') {
   const stream = cameraStreams.get(id);
   status.textContent = stream && stream.active ? 'Live camera' : 'Start this camera to see its feed.';
   if (stream && stream.active) {
    video.srcObject = stream;
    video.hidden = false;
    video.play().catch(() => {});
   }
   return;
  }
  const connection = connections.get(id);
  if (!connection || !connection.open) {
   status.textContent = 'Pair a Projection, Book View or Camera to see it here.';
   return;
  }
  subscription = connection;
  send(connection, {type:'screen-preview',token,enabled:true});
  status.textContent = 'Waiting for the display…';
  waiting = setTimeout(() => {
   status.textContent = 'No preview received. Reopen the display online and try again.';
  }, 6500);
 }

 function refresh() {
  if (!active) return;
  const old = select.value;
  const sources = [];
  for (const [id, device] of Object.entries(known)) {
   if (device.kind !== 'obs' && connections.get(id)?.open) sources.push(['display:'+id,device.name+' · '+device.code]);
  }
  for (const [id, camera] of cameraPhones) sources.push(['camera:'+id,camera.name+(camera.code?' · '+camera.code:'')]);
  select.replaceChildren(...sources.map(([value,label]) => new Option(label,value)));
  if (sources.some(([value])=>value===old)) select.value = old;
  if (!select.value || select.value!==old || select.value.startsWith('camera:') || subscription!==connections.get(select.value.slice(8))) showSource();
 }

 toggle.hidden = false;
 toggle.onclick = () => {
  active = !active;
  panel.hidden = !active;
  toggle.setAttribute('aria-expanded',String(active));
  toggle.textContent = active ? 'Hide Preview' : 'Live Preview';
  if (active) refresh();
  else showSource();
 };
 select.onchange = showSource;
 window.addEventListener('pagehide', unsubscribe);
 return {refresh, receive(connection, message) {
  if (!active || subscription !== connection) return;
  if (message.type === 'screen-preview-error') {
   status.textContent = 'The display could not render a preview.';
   return;
  }
  if (typeof message.frame !== 'string' || message.frame.length > 150000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(message.frame)) return;
  clearTimeout(waiting);
  image.src = message.frame;
  image.hidden = false;
  status.textContent = 'Display preview · refreshes every few seconds';
 }};
};
