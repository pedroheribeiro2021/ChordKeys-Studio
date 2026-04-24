import * as Tone from "tone";
import { getChordNotes } from "./chordUtils";

let synth;

export const initAudio = async () => {
  if (Tone.context.state !== "running") {
    await Tone.start();
  }

  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }
};

export const playNotes = async (notes) => {
  await initAudio();
  synth.triggerAttackRelease(notes, "8n");
};

export const playSong = async (song, onChordPlay) => {
  await initAudio();

  Tone.Transport.cancel();

  song.forEach((item) => {
    Tone.Transport.schedule((time) => {
      const notes = getChordNotes(item.chord);

      synth.triggerAttackRelease(notes, "2n", time);

      if (onChordPlay) {
        onChordPlay(notes);
      }
    }, item.time);
  });

  Tone.Transport.start();
};

export const stopSong = () => {
  Tone.Transport.stop();
  Tone.Transport.cancel();
};
