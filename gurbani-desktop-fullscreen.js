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
 close.onclick = exitApp;
 window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  exitApp();
 }, true);
})();
