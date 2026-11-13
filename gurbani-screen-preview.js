/* Send a small view of the rendered screen to its paired Controller on request. */
window.GurbaniScreenPreview = (function () {
 const subscriptions = new Map();
 const maxFrameLength = 150000;
 let library, timer, capturing = false;

 function renderer() {
  if (!library) library = new Promise((resolve, reject) => {
   const script = document.createElement('script');
   script.src = 'vendor/html2canvas-1.4.1.min.js';
   script.onload = () => resolve(window.html2canvas);
   script.onerror = () => { library = null; script.remove(); reject(new Error('Preview renderer unavailable')); };
   document.head.append(script);
  });
  return library;
 }

 async function capture() {
  if (capturing || !subscriptions.size) return;
  capturing = true;
  const recipients = [...subscriptions.keys()];
  try {
   const draw = await renderer();
   const scale = Math.min(1, 720 / innerWidth, 480 / innerHeight);
   const canvas = await draw(document.documentElement, {
    width: innerWidth, height: innerHeight, x: scrollX, y: scrollY,
    scale, logging: false, backgroundColor: '#000', imageTimeout: 2000
   });
   let frame = canvas.toDataURL('image/jpeg', .72);
   if (frame.length > maxFrameLength) frame = canvas.toDataURL('image/jpeg', .4);
   if (frame.length > maxFrameLength) throw new Error('Preview frame too large');
   for (const connection of recipients) {
    if (subscriptions.has(connection) && connection.open && (connection.bufferSize || 0) < 4) connection.send({type:'screen-preview-frame',frame});
   }
  } catch (error) {
   for (const connection of recipients) {
    if (subscriptions.has(connection) && connection.open && (connection.bufferSize || 0) < 4) connection.send({type:'screen-preview-error'});
   }
  } finally { capturing = false; }
 }

 function stop(connection) {
  subscriptions.delete(connection);
  if (!subscriptions.size && timer) { clearInterval(timer); timer = null; }
 }

 function request(connection, enabled) {
  if (!enabled) { stop(connection); return; }
  if (!subscriptions.has(connection)) {
   subscriptions.set(connection, true);
   connection.on('close', () => stop(connection));
  }
  if (!timer) timer = setInterval(capture, 2200);
  capture();
 }

 return {request};
})();
