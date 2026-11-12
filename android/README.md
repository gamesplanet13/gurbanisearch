# Android APK Builds

Two separate APK flavors:
- Controller: `in.gurbanisearch.controller`
- Projection: `in.gurbanisearch.projection`

Open GitHub **Actions > Build Controller and Projection APKs** and download each artifact ZIP after a successful run, then extract the .apk.

These are Android WebView wrappers for a **deployed sync server** hosting /index.html and /projection.html. On first launch, enter that server's base URL. Both devices must use the same server. Long-press to edit server URL; the projection mode keeps the display awake and uses immersive fullscreen.

**Important:** No public sync backend is deployed as part of this build. Until the backend is hosted, the APKs are installable shells, not a live Gurbani search/sync product. Debug builds are test-only and not Play Store signed production builds.
