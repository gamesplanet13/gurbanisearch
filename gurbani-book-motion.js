/* Keep the same reading position while changing the actual Gurbani font size. */
window.GurbaniBookMotion = function (surface, scroller, fontSize, previewSize, saveSize) {
 const page = scroller === (document.scrollingElement || document.documentElement);
 let pinch = null, zoomFrame = 0, scrollFrame = 0, pendingLine = null;

 function stopScroll() {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
 }

 function center(line) {
  stopScroll();
  if (!line) { pendingLine = null; return; }
  if (pinch) { pendingLine = line; return; }
  scrollFrame = requestAnimationFrame(() => {
   scrollFrame = 0;
   if (!surface.contains(line) || !surface.getClientRects().length) return;
   const top = page ? 0 : scroller.getBoundingClientRect().top;
   const height = page ? window.innerHeight : scroller.clientHeight;
   const bounds = line.getBoundingClientRect();
   const target = Math.max(0, Math.min(scroller.scrollHeight - height,
     scroller.scrollTop + bounds.top - top + (surface.dataset.alignment === 'top' ? -Math.min(96, height * .16) : bounds.height / 2 - height / 2)));
   if (Math.abs(scroller.scrollTop - target) < 2) return;
   const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   const nativeScroller = page ? window : scroller;
   if (!reduced && 'scrollBehavior' in document.documentElement.style && typeof nativeScroller.scrollTo === 'function') {
    nativeScroller.scrollTo({top:target,behavior:'smooth'});
   } else {
    scroller.scrollTop = target;
   }
  });
 }

 function distance(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
 }

 function updatePinch() {
  zoomFrame = 0;
  if (!pinch) return;
  previewSize(pinch.next);
  if (pinch.line && surface.contains(pinch.line)) {
   const bounds = pinch.line.getBoundingClientRect();
   scroller.scrollTop += bounds.top + bounds.height * pinch.anchor - pinch.y;
  }
 }

 surface.addEventListener('touchstart', event => {
  stopScroll();
  if (event.touches.length !== 2 || pinch) return;
  const initialDistance = distance(event.touches);
  if (!initialDistance) return;
  const a = event.touches[0], b = event.touches[1], y = (a.clientY + b.clientY) / 2;
  const hit = document.elementFromPoint((a.clientX + b.clientX) / 2, y);
  const line = hit && hit.closest('.line, .alt-book-line, .searcher-line');
  const bounds = line && line.getBoundingClientRect();
  const size = fontSize();
  pinch = {distance:initialDistance, size, next:size, line, y,
   anchor:bounds && bounds.height ? Math.max(0, Math.min(1, (y - bounds.top) / bounds.height)) : 0};
  event.preventDefault();
 }, {passive:false});

 surface.addEventListener('touchmove', event => {
  if (!pinch || event.touches.length !== 2) return;
  event.preventDefault();
  pinch.next = Math.max(14, Math.min(85, pinch.size * distance(event.touches) / pinch.distance));
  pinch.y = (event.touches[0].clientY + event.touches[1].clientY) / 2;
  if (!zoomFrame) zoomFrame = requestAnimationFrame(updatePinch);
 }, {passive:false});

 function finish(event) {
  if (!pinch || (event.type !== 'touchcancel' && event.touches.length >= 2)) return;
  if (zoomFrame) cancelAnimationFrame(zoomFrame);
  pinch.next = Math.round(pinch.next);
  updatePinch();
  const changed = pinch.next !== pinch.size;
  pinch = null;
  if (changed) saveSize();
  if (pendingLine) { const line = pendingLine; pendingLine = null; center(line); }
 }

 surface.addEventListener('touchend', finish);
 surface.addEventListener('touchcancel', finish);
 surface.addEventListener('wheel', stopScroll, {passive:true});
 return {center, pinching: () => pinch !== null};
};
