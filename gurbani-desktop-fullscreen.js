/* Fullscreen control for Windows launches, including browsers that ignore startup flags. */
(function () {
 if (!/[?&]desktop=windows(?:&|$)/.test(location.search)) return;
 const root = document.documentElement;
 if (!root.requestFullscreen) return;
 const button = document.createElement('button');
 button.type = 'button';
 button.textContent = 'Full Screen';
 button.style.cssText = 'position:fixed;top:8px;left:10px;z-index:50;padding:6px 10px;background:#19243a;color:white;border:1px solid #71839e;border-radius:6px;cursor:pointer';
 function refresh() {
  button.hidden = !!document.fullscreenElement || (Math.abs(window.outerHeight - window.innerHeight) <= 3 && Math.abs(screen.height - window.innerHeight) <= 3);
 }
 button.onclick = () => root.requestFullscreen().catch(() => {button.textContent = 'Full Screen · F11';});
 document.body.appendChild(button);
 document.addEventListener('fullscreenchange', refresh);
 window.addEventListener('resize', refresh);
 refresh();
})();
