import * as Tone from "tone";

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
  await initAudio(); // garante que está ativo
  synth.triggerAttackRelease(notes, "8n");
};
