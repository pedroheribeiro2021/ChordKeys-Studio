import * as Tone from "tone";
import { getChordNotes } from "../utils/chordUtils";

let synth;
let totalTicks = 0;

const transport = () => Tone.getTransport();

// Batidas → notação de ticks do Tone ("960i"), para que o BPM afete o andamento
const beatsToTicks = (beats) => `${Math.round(beats * transport().PPQ)}i`;

// Envelope de piano: ataque rápido e decaimento até o silêncio. Segurar a tecla não
// prende a nota para sempre; soltar (sem sustain) corta com uma cauda curta.
const PIANO_ENVELOPE = { attack: 0.005, decay: 2.5, sustain: 0, release: 0.35 };

export const initAudio = async () => {
  if (!synth) {
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth, { envelope: PIANO_ENVELOPE }).toDestination();
  }
};

// No celular, "pointerdown" não libera o áudio do navegador; "pointerup"/"keydown" sim.
// Destrava no primeiro gesto em qualquer lugar para a 1ª tecla já soar.
export const unlockAudioOnFirstGesture = () => {
  const unlock = () => {
    initAudio().catch(() => {});
    for (const type of ["pointerup", "keydown"]) window.removeEventListener(type, unlock);
  };
  for (const type of ["pointerup", "keydown"]) window.addEventListener(type, unlock);
};

// ---------- Teclado tocado pelo usuário ----------

let sustain = false;
const held = new Set(); // teclas fisicamente apertadas
const sounding = new Set(); // notas soando (apertadas ou presas pelo sustain)
const autoRelease = new Map(); // nota → timer

const release = (note) => {
  clearTimeout(autoRelease.get(note));
  autoRelease.delete(note);
  synth.triggerRelease(note);
  sounding.delete(note);
};

// Com sustain, a nota solta já decaiu ao silêncio em ~2,5 s, mas continua ocupando uma
// voz do sintetizador (limite de 32). Libera sozinha depois disso para não perder notas.
const releaseAfterDecay = (note) => {
  clearTimeout(autoRelease.get(note));
  autoRelease.set(
    note,
    setTimeout(() => {
      if (sounding.has(note) && !held.has(note)) release(note);
    }, (PIANO_ENVELOPE.decay + 0.5) * 1000),
  );
};

export const noteOn = async (note) => {
  held.add(note);
  await initAudio();

  // Soltou antes do áudio iniciar (1º toque): toca curtinho em vez de prender a nota
  if (!held.has(note) && !sustain) {
    synth.triggerAttackRelease(note, 0.15);
    return;
  }

  if (sounding.has(note)) release(note);
  synth.triggerAttack(note);
  sounding.add(note);

  if (!held.has(note)) releaseAfterDecay(note);
};

export const noteOff = (note) => {
  held.delete(note);
  if (!sounding.has(note) || !synth) return;

  if (sustain) releaseAfterDecay(note);
  else release(note);
};

export const getSustain = () => sustain;

// Como o pedal: ligado, soltar a tecla não corta a nota; desligado, corta o que não está apertado
export const setSustain = (on) => {
  sustain = on;
  if (on || !synth) return;

  for (const note of [...sounding]) {
    if (!held.has(note)) release(note);
  }
};

// Toca as notas com um pequeno atraso entre elas, como uma batida de violão
const playChordStrum = (notes, time) => {
  const strumDelay = 0.05;

  notes.forEach((note, index) => {
    synth.triggerAttackRelease(note, "2n", time + index * strumDelay);
  });
};

// song: [{ chord, beat }]. onChordPlay é chamado sincronizado com o áudio.
export const playSong = async (song, { totalBeats, onChordPlay, onEnd } = {}) => {
  await initAudio();

  stopSong();

  song.forEach((item, index) => {
    transport().schedule((time) => {
      const notes = getChordNotes(item.chord);
      playChordStrum(notes, time);

      Tone.getDraw().schedule(() => onChordPlay?.(notes, item.chord, index), time);
    }, beatsToTicks(item.beat));
  });

  totalTicks = Math.round(totalBeats * transport().PPQ);

  // O fim não pode passar pelo Draw: com a aba em segundo plano o Draw descarta
  // eventos e a música nunca terminaria. setTimeout continua rodando.
  transport().schedule((time) => {
    const delayMs = Math.max(0, (time - Tone.now()) * 1000);
    setTimeout(() => {
      stopSong();
      onEnd?.();
    }, delayMs);
  }, `${totalTicks}i`);

  transport().start();
};

export const resumeSong = () => {
  if (transport().state === "paused") transport().start();
};

export const pauseSong = () => {
  transport().pause();
};

export const stopSong = () => {
  transport().stop();
  transport().cancel();
  transport().position = 0;
};

export const setBPM = (bpm) => {
  transport().bpm.value = bpm;
};

// Fração da música já tocada (0 a 1); respeita pausa e mudança de BPM
export const getProgress = () =>
  totalTicks > 0 ? Math.min(transport().ticks / totalTicks, 1) : 0;

export const playNotes = async (notes) => {
  await initAudio();
  synth.triggerAttackRelease(notes, "2n");
};
