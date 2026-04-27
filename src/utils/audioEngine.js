import * as Tone from "tone";
import { getChordNotes } from "../utils/chordUtils";

let synth;

export const initAudio = async () => {
  await Tone.start();

  synth = new Tone.PolySynth(Tone.Synth).toDestination();
};

// 🔥 NOVA FUNÇÃO DE STRUM
const playChordStrum = (notes, time) => {
  const strumDelay = 0.05; // 50ms entre notas

  notes.forEach((note, index) => {
    synth.triggerAttackRelease(note, "2n", time + index * strumDelay);
  });
};

export const playSong = async (song, onChordPlay) => {
  await initAudio();

  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;

  song.forEach((item) => {
    Tone.Transport.schedule((time) => {
      const notes = getChordNotes(item.chord);

      // 🔥 AQUI TROCA
      playChordStrum(notes, time);

      if (onChordPlay) {
        onChordPlay(notes, item.chord);
      }
    }, item.time);
  });

  Tone.Transport.start();
};

export const stopSong = () => {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.Transport.position = 0;
};

export const setBPM = (bpm) => {
  Tone.Transport.bpm.value = bpm;
};

export const playNotes = async (notes) => {
  await initAudio();
  synth.triggerAttackRelease(notes, "2n");
};
