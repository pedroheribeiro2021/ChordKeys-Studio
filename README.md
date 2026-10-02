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
- **Simplify chords**: reduces to triads (`C7M(9)` → `C`, `F#m7(b5)` → `F#m`).
- **Capo suggestion**: finds the fret that leaves the fewest barre chords.
- **Auto-scroll** with speed control; keeps the screen awake (Wake Lock).

**Import and library**
- Paste a chord sheet (headers, tablature and tabs are cleaned up), or open `.txt`, **ChordPro** or **PDF** files.
- PDFs are rebuilt from the text positions on the page, so each chord lands back on the right syllable.
- Saved songs stay on the device (IndexedDB), with key, capo and simplify settings; JSON backup export/import.

## Stack

React 19 · Vite 8 · Tone.js · pdf.js (lazy-loaded) · vite-plugin-pwa · Vitest. No backend: the app is fully static.

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
    guitar.js       guitar shapes, simplification, capo suggestion
    sheet.js        chord sheet formatting with stable columns
    songStore.js    IndexedDB storage and JSON backup
    importers/      paste cleanup, ChordPro, PDF layout reconstruction
docs/
  ADR/                    architecture decisions
  Pendencias.md           open tasks
  Registro-de-Sessoes.md  session log
```

## Architecture decisions

- [ADR 0001](docs/ADR/0001-cifras-salvas-no-aparelho.md) — saved songs stay on the device (IndexedDB + JSON backup).
- [ADR 0002](docs/ADR/0002-importar-sem-servidor.md) — import without a server (paste, .txt, ChordPro, PDF).

## Workflow

Feature branches with pull requests into `develop`; `main` receives releases from `develop`. CI runs lint, tests and build on every PR.
