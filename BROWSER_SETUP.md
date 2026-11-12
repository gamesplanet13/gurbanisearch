# Browser setup — Gurbani Searcher

Two browser entrypoints served by **one Node.js server**:

- Controller: `http://SERVER-IP:3000/`
- Projection: `http://SERVER-IP:3000/projection.html`

## Run (PC or hosting service)
Install Node.js 20+, clone this repository, then run:

```bash
npm start
```

Open controller on a mobile browser and projection on TV / PC / second mobile browser. Both must reach the **same running server** (same local network, or secure hosted endpoint).

1. Open Projection first and find its five-digit pairing code.
2. Enter the code on Controller, or enter Controller's five-digit code on Projection and tap Join.
3. Tick the desired connected screens on Controller.
4. Search Gurbani; open a shabad and tap a line to project it.
5. Change verse / translation size in Controller. When Controller closes, Projection stays on the last slide.

Search proxies BaniDB API; internet is needed for search. Verify translations and first-letter search schema against the live API before relying on it in a service.

## Important limitations
- **GitHub Pages alone cannot execute server.js.** A Node.js service is required for multi-device synchronization.
- The current 5-digit pairing is appropriate only for trusted LAN prototype use. Do **not** expose the server publicly as-is: implement authentication, code expiry, throttling and TLS first.
- State saves in state.json on the server; last slide also caches in the Projection browser.
- The server must remain available for changes to synchronize, and browsers may pause background tabs.
- No payment QR, ads, or Games Planet branding.
