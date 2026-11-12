/* Connection lifecycle shared by controller, projection and book view. */
(function () {
  'use strict';
  window.GurbaniPeer = {
    start: function (options) {
      let current = null, timer = null, attempts = 0, opened = false;
      const setStatus = message => options.onStatus(message);
      function schedule(delay) {
        if (timer) return;
        timer = setTimeout(() => { timer = null; retry(); }, delay);
      }
      function retry() {
        if (navigator.onLine === false) {
          setStatus('No internet — reconnecting automatically');
          schedule(5000); return;
        }
        if (current && !current.destroyed && current.open) return;
        if (current && !current.destroyed && current.disconnected && opened) {
          try { current.reconnect(); setStatus('Reconnecting…'); schedule(12000); return; }
          catch (_) { current.destroy(); }
        }
        if (current && !current.destroyed) current.destroy();
        create();
      }
      function create() {
        if (typeof Peer === 'undefined') { setStatus('Connection library unavailable — reopen app online'); schedule(10000); return; }
        setStatus('Connecting…'); opened = false;
        const p = current = new Peer(options.id(), {debug: 0});
        options.onPeer(p);
        p.on('open', () => {
          if (p !== current) return;
          opened = true; attempts = 0;
          if (timer) { clearTimeout(timer); timer = null; }
          options.onOpen();
        });
        p.on('connection', conn => { if (p === current) options.onConnection(conn); });
        p.on('disconnected', () => {
          if (p !== current) return;
          setStatus('Connection offline — reconnecting automatically'); schedule(1500);
        });
        p.on('close', () => {
          if (p !== current) return;
          setStatus('Connection closed — reconnecting automatically'); schedule(2500);
        });
        p.on('error', e => {
          if (p !== current) return;
          if (e.type === 'unavailable-id') {
            current = null; p.destroy(); options.onCollision(); schedule(1500); return;
          }
          if (e.type === 'peer-unavailable') {
            options.onTargetUnavailable(); return;
          }
          if (e.type === 'network' || e.type === 'socket-error' || e.type === 'socket-closed' || e.type === 'server-error') {
            current = null; p.destroy();
            setStatus('Connection server unavailable — retrying; check internet');
            schedule(Math.min(30000, 3000 * Math.pow(2, Math.min(attempts++, 3))));
          } else {
            setStatus('Connection error: ' + (e.message || e.type || 'unknown'));
          }
        });
        schedule(15000); // Recover a signalling attempt that never reports success or failure.
      }
      addEventListener('online', () => { if (timer) {clearTimeout(timer); timer = null} retry(); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && (!current || current.disconnected || current.destroyed)) retry(); });
      create();
      return {retry};
    }
  };
})();
