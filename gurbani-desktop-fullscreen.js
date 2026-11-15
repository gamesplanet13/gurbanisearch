/* Window actions for the Windows launcher. */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get('desktop') !== 'windows') return;

  const controls = document.createElement('div');
  controls.style.cssText = 'position:fixed;top:8px;right:10px;z-index:1000;display:flex;gap:8px';
  const style = 'padding:7px 11px;background:#19243a;color:white;border:1px solid #71839e;border-radius:6px;cursor:pointer';
  const button = (label, action) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = label;
    el.style.cssText = style;
    el.onclick = action;
    return el;
  };
  const exit = button('Exit', () => {
    if (dialog.open) return;
    prompt('Exit', 'Close this Gurbani window?', 'Exit', () => {
      document.title = 'Gurbani Windows Close';
      window.close();
    });
  });
  const fullscreen = button('Full Screen', () => document.documentElement.requestFullscreen().catch(() => {}));
  controls.append(fullscreen, exit);
  document.body.append(controls);
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'background:#17243a;color:#fff;border:1px solid #e5c77f;border-radius:12px;padding:20px;max-width:90vw';
  document.body.append(dialog);
  function prompt(title, message, action, callback) {
    if (dialog.open) return;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = message;
    const cancel = button('Cancel', () => dialog.close());
    const confirm = button(action, () => { dialog.close(); callback(); });
    dialog.replaceChildren(heading, text, cancel, confirm);
    dialog.setAttribute('aria-label', title);
    dialog.showModal();
    cancel.focus();
  }
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' && event.key !== 'BrowserBack' &&
        !(event.altKey && (event.key === 'ArrowLeft' || event.key === 'F4'))) return;
    if (dialog.open && event.key === 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    exit.click();
  }, true);
  window.addEventListener('auxclick', event => {
    if (event.button !== 3) return;
    event.preventDefault();
    exit.click();
  }, true);
  const version = Number(params.get('nativeVersion'));
  let offered = 0;
  async function checkUpdate() {
    if (!version || document.hidden || dialog.open) return;
    try {
      const response = await fetch('windows/update.json', {cache:'no-store'});
      if (!response.ok) return;
      const update = await response.json();
      if (!Number.isSafeInteger(update.version) || update.version <= Math.max(version, offered)) return;
      offered = update.version;
      prompt('Update available', 'Install the Gurbani Windows update?', 'Update', () => {
        document.title = 'Gurbani Windows Install ' + update.version;
      });
    } catch (_) {}
  }
  checkUpdate();
  setInterval(checkUpdate, 300000);
  document.addEventListener('visibilitychange', checkUpdate);
})();
