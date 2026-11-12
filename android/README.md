# Gurbani Searcher — Three Android Apps

The GitHub Actions workflow builds **three independent debug APKs**:

| App | Application ID | Page |
|---|---|---|
| Gurbani Controller | `in.gurbanisearch.controller` | `https://gamesplanet13.github.io/gurbanisearch/index.html` |
| Gurbani Projection | `in.gurbanisearch.projection` | `https://gamesplanet13.github.io/gurbanisearch/projection.html` |
| Gurbani Book View | `in.gurbanisearch.book` | `https://gamesplanet13.github.io/gurbanisearch/book.html` |

All launch directly in fullscreen Android WebView, support portrait/landscape rotation, and use the same static GitHub Pages PeerJS/WebRTC system.

## APK download

Open [Actions](https://github.com/gamesplanet13/gurbanisearch/actions/workflows/build-android-apks.yml). Select a successful `Build Gurbani Controller Projection and Book APKs` run, then download:
- Gurbani-Controller-APK
- Gurbani-Projection-APK
- Gurbani-Book-View-APK

Each artifact is a ZIP containing a debug APK. GitHub must finish the build successfully before these artifacts exist. Debug APKs are test builds, not release-signed production APKs.

## Notes

- These WebView apps display the website, and do **not** conceal the public website source.
- Internet is required for PeerJS signaling and BaniDB search.
- All three can be installed simultaneously.
- The Book View shows only Gurbani text and highlights the line chosen on the controller.
- Source privacy requires a private repository / different deployment architecture; packaging into an APK does not make public JavaScript secret.
