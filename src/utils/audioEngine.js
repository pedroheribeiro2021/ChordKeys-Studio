/* eslint-disable no-unused-vars */
import * as Tone from "tone";
import { getChordNotes } from "../utils/chordUtils";

let synth;
let isPlaying = false;
let lastSong = null;
let lastOnChordPlay = null;
let lastSongData = null;

export const initAudio = async () => {
  if (!synth) {
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
};

// 🔥 STRUM mantido
const playChordStrum = (notes, time) => {
  const strumDelay = 0.05;

  notes.forEach((note, index) => {
    synth.triggerAttackRelease(note, "2n", time + index * strumDelay);
  });
};

// Função para tocar uma música
export const playSong = async (song, onChordPlay) => {
  await initAudio();

  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;

  lastSong = song;
  lastOnChordPlay = onChordPlay;
  lastSongData = song;

  song.forEach((item, index) => {
    Tone.Transport.schedule((time) => {
      const notes = getChordNotes(item.chord);

      playChordStrum(notes, time);

      if (onChordPlay) {
        onChordPlay(notes, item.chord, index);
      }
    }, item.time);
  });

  Tone.Transport.start();
  isPlaying = true;
};

// Resume playback from current position
export const resumeSong = () => {
  if (!isPlaying && lastSongData) {
    Tone.Transport.start();
    isPlaying = true;
  }
};

export const pauseSong = () => {
  Tone.Transport.pause();
  isPlaying = false;
};

export const stopSong = () => {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;
  isPlaying = false;
};

export const setBPM = (bpm) => {
  Tone.Transport.bpm.value = bpm;
};

export const playNotes = async (notes) => {
  await initAudio();
  synth.triggerAttackRelease(notes, "2n");
};
