# ChordKeys Studio

A mobile-first web app (installable PWA) to see, hear and play the chords of any song — on piano or guitar.

The interface is in Brazilian Portuguese and understands the chord notation used in Brazilian chord sheets (`C7M(9)`, `F#m7(b5)`, `Bbº`, `D/F#`…).

## Features

**Studio (piano)**
- Interactive two-octave keyboard with sound (Tone.js).
- Plays any chord sheet with BPM, beats per chord, pause/resume and transposition.
- Karaoke line, chord timeline and progress bar synced with playback.
- Mini keyboards for every chord in the song, with optional inversion.
- Learning mode: playing the right chord on the keyboard advances the song.

**Guitar**
- Chord sheet with chords highlighted over the lyrics, transposed without breaking the alignment.
- Chord diagrams (open shapes and E/A barre shapes for any root).
- **Smart chord simplification**: keeps harmonic color by default, offers ranked alternatives for easy/balanced/faithful playing, and considers chord context and repertoire.
- **Capo suggestion**: finds the fret that leaves the fewest barre chords.
- **Auto-scroll** with speed control; keeps the screen awake (Wake Lock).
- **Smart chord simplification** ranks playable alternatives using chord context, selected song key/mode and a faithful/balanced/easy style.
- **Multi-column sheet view** with one, two or three columns on wider screens.

**Import and library**
- Paste a chord sheet (headers, tablature and tabs are cleaned up), or open `.txt`, **ChordPro** or **PDF** files.
- PDFs are rebuilt from the text positions on the page, so each chord lands back on the right syllable.
- Saved songs stay in IndexedDB for offline use and sync across devices through Firebase Authentication and Cloud Firestore; JSON backup export/import remains available.

## Stack

React 19 · Vite 8 · Tone.js · pdf.js (lazy-loaded) · Firebase Authentication · Cloud Firestore · vite-plugin-pwa · Vitest.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable **Google** in Authentication → Sign-in method.
3. Create a Cloud Firestore database; in its **Rules** tab, paste `firestore.rules` and publish.
4. Copy `.env.example` to `.env.local` and fill in the Web app's API key, Auth domain, project ID and app ID. Restart `npm run dev` after changing the file; Vite reads `VITE_*` values at startup/build time.
5. Add `localhost` and the deployed app's exact hostname to Authentication → Settings → Authorized domains. Set the same `VITE_FIREBASE_*` values in the static host's build environment before rebuilding/redeploying; setting them only in the hosting dashboard without a new build does not update an existing bundle.

Firebase web config values identify the project; Firestore Security Rules enforce per-account access. The rules only allow each signed-in user to read and write `users/{uid}/songs/*` for their own UID. The Spark plan has daily read/write limits; monitor usage in the Firebase console. IndexedDB stays as the offline copy and pending local deletions are synchronized as tombstones.

Smart chord simplification is enabled by default. Set `VITE_SMART_CHORDS=false` at build time to use the legacy simplifier instead.

## Getting started

Requires Node 22+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest
npm run lint
npm run build    # static output in dist/
```

The service worker only runs in the production build (`npm run build && npm run preview`).

## Project structure

```
src/
  components/     UI (Piano, GuitarView, Library, ChordInput…)
  hooks/          useAutoScroll, useHashView
  utils/
    chordUtils.js   chord parsing and notes (flats, extensions, slash chords)
    transpose.js    transposition keeping the chord suffix
    guitar.js       compatible guitar API and capo suggestion
    chordParser.js  structured chord parsing and formatting
    chordShapes.js  open/movable guitar shapes and complexity
    chordSimplifier.js repertoire-aware candidate generation
    chordRanker.js  playable-shape and harmony ranking
    repertoire.js   chord-sheet classification and profiles
    sheet.js        chord sheet formatting with stable columns
    songStore.js    IndexedDB storage, sync merge and JSON backup
    firebase.js     Google authentication and Firestore synchronization
    importers/      paste cleanup, ChordPro, PDF layout reconstruction
docs/
  ADR/                    architecture decisions
  Pendencias.md           open tasks
  Registro-de-Sessoes.md  session log
```

## Architecture decisions

- [ADR 0001](docs/ADR/0001-cifras-salvas-no-aparelho.md) — IndexedDB offline storage and Firebase cross-device sync.
- [ADR 0002](docs/ADR/0002-importar-sem-servidor.md) — import without a server (paste, .txt, ChordPro, PDF).

## Workflow

Feature branches with pull requests into `develop`; `main` receives releases from `develop`. CI runs lint, tests and build on every PR.
