# Gurbani Searcher — GitHub Pages (no Node.js server)

## Pages
- Control: https://gamesplanet13.github.io/gurbanisearch/
- Projection: https://gamesplanet13.github.io/gurbanisearch/projection.html

These are static HTML sites, directly served by GitHub Pages. Both browser pages use PeerJS/WebRTC signaling through the public PeerJS cloud service, like the Games Planet QR projection proof-of-concept. A **self-hosted** Node.js server is not needed.

## Deployment
In the GitHub repository, go to Settings -> Pages -> Build and deployment -> Deploy from a branch -> main -> / (root), then Save. GitHub Pages activation and successful deployment are required before these URLs work.

## Usage
1. Open Projection on a TV / computer browser and keep it open. Note its 5-digit code.
2. Open Control on the mobile browser, enter that code and press Connect.
3. Alternatively enter the Control 5-digit code on the Projection page and press Connect.
4. Select the projection checkbox; search a Gurbani line using the BaniDB API, open a shabad and tap a line.
5. The slide persists in Projection browser's localStorage if the controller disconnects or is closed. Reopen/reconnect the Control page when needed.

## Limits and safety
- PeerJS public signaling infrastructure and STUN/network conditions must work; this does **not** work without all external network services. Browser-to-browser WebRTC connections can fail on restrictive networks; TURN fallback is not provisioned.
- Five-digit codes can be guessed. This is a **trusted-device prototype**, not suitable as a publicly accessible service with confidential content or high-security authorization.
- Controller token stored on Projection persists to prevent an unrelated controller from replacing it. To switch owner, clear this site's Projection browser storage or use a future secure reset screen.
- BaniDB API is a third-party service, and may limit browser-origin requests (CORS), change schemas or be unavailable; search has not been verified in all browsers. Hindi/Punjabi translations and Hindi transliteration only display when the fetched data contains them; none are fabricated.
- Browsers must remain running for realtime updates; localStorage retains the last shown slide but does not synchronize it while browsers are fully closed.
- This version requires no Games Planet logo, QR payment, advertisements or live server deployment by the user.
- The older Node.js-based files are retained only for reference; use root `index.html` and root `projection.html` for GitHub Pages.
