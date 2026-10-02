import * as Tone from "tone";
import { getChordNotes } from "../utils/chordUtils";

let synth;
let totalTicks = 0;

const transport = () => Tone.getTransport();

// Batidas → notação de ticks do Tone ("960i"), para que o BPM afete o andamento
const beatsToTicks = (beats) => `${Math.round(beats * transport().PPQ)}i`;

export const initAudio = async () => {
  if (!synth) {
    await Tone.start();
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
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
