'use strict';

window.setupSangatPublisher = function (menu, currentContent) {
  const endpoint = 'https://sangat-view-live.gamesplanet.chatgpt.site/live';
  const storageKey = 'gb-sangat-publisher-key';
  const enableKey = 'gb-sangat-live-on';
  let key = localStorage.getItem(storageKey) || '';
  let enabled = !!key && localStorage.getItem(enableKey) === '1';
  let pending, busy = false, timer;
  const panel = document.createElement('details');
  panel.innerHTML = '<summary>ਸੰਗਤ ਵਿਊ · Sangat View</summary>' +
    '<label>Controller setup key <input type="password" autocomplete="off" spellcheck="false"></label>' +
    '<div><button type="button">Start live</button> <button type="button">Stop live</button></div>' +
    '<p role="status"></p><a href="sangat.html" target="_blank" rel="noopener">Open Sangat View</a>';
  const input = panel.querySelector('input');
  const [start, stop] = panel.querySelectorAll('button');
  const message = panel.querySelector('p');
  menu.append(panel);

  function updateUI(text) {
    start.disabled = false;
    stop.disabled = !enabled;
    input.placeholder = key ? 'Saved on this device' : 'Paste once on Control';
    message.textContent = text;
  }
  async function submit() {
    if (busy || pending === undefined || !key) return;
    clearTimeout(timer);
    const content = pending;
    pending = undefined;
    busy = true;
    let failed = false;
    try {
      const response = await fetch(endpoint, {
        method:'PUT',
        headers:{'Content-Type':'application/json', 'Authorization':'Bearer ' + key},
        body:JSON.stringify({content}),
        signal:AbortSignal.timeout(9000),
      });
      if (response.status === 401) {
        enabled = false;
        localStorage.setItem(enableKey, '0');
        updateUI('The controller key was rejected.');
        return;
      }
      if (!response.ok) throw new Error('Broadcast failed');
      updateUI(enabled ? 'ਲਾਈਵ · Sangat View is on' : 'Sangat View is off');
    } catch (_) {
      failed = true;
      if (pending === undefined) pending = content;
      updateUI('Live feed disconnected. Retrying…');
    } finally {
      busy = false;
      if (pending !== undefined) timer = setTimeout(submit, failed ? 3500 : 0);
    }
  }

  function send(content) {
    if (content === null) pending = null;
    else {
      const rows = Array.isArray(content.bookLines) ? content.bookLines : [];
      const index = Number.isInteger(content.activeIndex) ? content.activeIndex : 0;
      const first = Math.max(0, Math.min(index - 200, rows.length - 400));
      pending = {
        verse:String(content.verse || '').slice(0,8192), mode:content.mode,
        bookLines:rows.slice(first,first + 400).map(line => String(line).slice(0,500)),
        activeIndex:Math.max(0,index - first), ang:content.ang,
        shabadTitle:String(content.shabadTitle || '').slice(0,180),
      };
    }
    submit();
  }

  start.onclick = () => {
    key = input.value.trim() || key;
    if (!key) { updateUI('Enter the controller setup key first.'); return; }
    localStorage.setItem(storageKey, key);
    localStorage.setItem(enableKey, '1');
    input.value = '';
    enabled = true;
    updateUI('Starting live…');
    send(currentContent());
  };
  stop.onclick = () => {
    enabled = false;
    localStorage.setItem(enableKey, '0');
    updateUI('Stopping live…');
    send(null);
  };
  updateUI(enabled ? 'ਲਾਈਵ · Sangat View is on' : 'Sangat View is off');
  window.addEventListener('online', submit);
  return {send(content) { if (enabled) send(content); }, active:()=>enabled};
};
