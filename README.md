# Gurbani Searcher & Live Projection

Independent Gurbani search, mobile controller and multi-screen projection project.

## Product goals
- **Controller:** Search Gurbani by first letters, browse matching shabads, choose a line and project it.
- **Language:** English keyboard/interface by default; optional Gurmukhi and Hindi input; Gurbani in Gurmukhi or Hindi script where supported, with English/Hindi/Punjabi translation options where licensed/available.
- **Projection:** Black background, large Gurbani text and selectable translation; independent font-size controls.
- **Persistence:** Keep the last projected shabad/line visible when the controller closes or disconnects. Restore last shown content after restarting the projection app when possible.
- **Multiple displays:** Android TVs, LCD-connected computers and phones; one controller can send to multiple authorized projectors.
- **Pairing both ways:** Controller enters projector pairing code, or projector enters controller pairing code. Projectors must be authorized to control a session.
- **Network modes:** LAN/Wi-Fi synchronization first; later Internet-based private rooms and optional public read-only broadcasts without codes. Public viewers must not gain editing permissions.
- **Dedicated apps:** Android controller app and Android projection app. Web views are an initial prototype; APK packaging remains separate work.
- **No payment QR, business logos or ads.** This is separate from Games Planet's payment projection app.

## Suggested architecture
- `public/index.html`: Controller page.
- `public/projection.html`: Projection display.
- `public/public.html`: Read-only audience view.
- `server.js`: Session, pairing and synchronization backend.
- `public/*.js`: Frontend interactions.
- Persist room/displays/last-published state on the server, with durable display-local cache as a fallback.
- For real Internet deployment, use HTTPS, authenticated authorization, non-guessable session credentials, and a secure database; 5-digit codes should be short-lived onboarding codes only.

## Gurbani sources
Research licensed/open data or APIs from [BaniDB](https://github.com/KhalisFoundation/banidb-api) and [Shabad OS](https://github.com/shabados/shabados). Respect source-specific licensing and translation availability.

## Status
Repository initialized with project specification. A separate local source prototype was created in the ChatGPT working environment; **it has not yet been committed here**. These specifications are not a claim that a full app, hosted backend, or APK is deployed.

## Next implementation milestones
1. Commit the existing controller/projection/server prototype source.
2. Test live Gurbani search and language mappings with data provider.
3. Implement durable state, reverse pairing, multi-screen permissions and public mode.
4. Deploy HTTPS synchronization backend and test remote connection.
5. Package and test Android mobile controller and TV projection APKs.
