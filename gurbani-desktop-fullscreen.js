/* Desktop-only window controls. */
(function () {
 if (!/[?&]desktop=windows(?:&|$)/.test(location.search)) return;
 const root = document.documentElement;
 const button = document.createElement('button');
 button.type = 'button';
 button.textContent = 'Full Screen';
 button.style.cssText = 'position:fixed;top:8px;left:10px;z-index:50;padding:6px 10px;background:#19243a;color:white;border:1px solid #71839e;border-radius:6px;cursor:pointer';
 function refresh() {
  button.hidden = !root.requestFullscreen || !!document.fullscreenElement || (Math.abs(window.outerHeight - window.innerHeight) <= 3 && Math.abs(screen.height - window.innerHeight) <= 3);
 }
 button.onclick = () => root.requestFullscreen().catch(() => {button.textContent = 'Full Screen · F11';});
 document.body.appendChild(button);
 document.addEventListener('fullscreenchange', refresh);
 window.addEventListener('resize', refresh);
 refresh();

 const close = document.createElement('button');
 close.type = 'button';
 close.textContent = 'Close App';
 const menu = document.getElementById('menuOptions') || document.getElementById('setup') || document.getElementById('panel');
 if (menu) menu.appendChild(close);
 else {
  const controls = document.createElement('details');
  controls.style.cssText = 'position:fixed;top:10px;right:10px;z-index:50;background:#19243a;color:white;padding:8px';
  const label = document.createElement('summary');
  label.textContent = '☰';
  label.setAttribute('aria-label','App menu');
  controls.append(label,close);
  document.body.appendChild(controls);
 }
 function exitApp() {
  document.title = 'Gurbani Windows Close';
  window.close();
 }
 // Only Projection needs an explicit exit confirmation on Windows.
 const isProjection = location.pathname.endsWith('/projection.html');
 let exitDialog = null;
 if (isProjection) {
  exitDialog = document.createElement('dialog');
  exitDialog.setAttribute('aria-label', 'Exit Projection');
  exitDialog.style.cssText = 'background:#17243a;color:#fff;border:1px solid #e5c77f;border-radius:12px;padding:20px;max-width:90vw;z-index:2147483647';
  const title = document.createElement('strong');
  title.textContent = 'Exit Projection?';
  const note = document.createElement('p');
  note.textContent = 'Close Gurbani Projection?';
  const no = document.createElement('button');
  no.textContent = 'Cancel';
  const yes = document.createElement('button');
  yes.textContent = 'Exit';
  no.onclick = () => exitDialog.close();
  yes.onclick = exitApp;
  for (const b of [no,yes]) b.style.cssText = 'min-width:78px;padding:9px;margin:6px;background:#263d5b;color:white;border:1px solid #7089a8;border-radius:7px';
  exitDialog.append(title,note,no,yes);
  document.body.appendChild(exitDialog);
  exitDialog.addEventListener('close', () => close.focus({preventScroll:true}));
 }
 function requestExit() {
  if (!isProjection) return exitApp();
  if (exitDialog.open) return;
  exitDialog.showModal();
  exitDialog.querySelector('button')?.focus();
 }
 close.onclick = requestExit;
 window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (isProjection && exitDialog?.open) return; // Escape closes dialog without exiting.
  event.preventDefault();
  event.stopImmediatePropagation();
  requestExit();
 }, true);
})();
