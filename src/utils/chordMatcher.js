export const matchChord = (playedNotes, targetNotes) => {
  const normalize = (notes) => notes.map((n) => n.replace(/[0-9]/g, "")).sort();

  const a = normalize(playedNotes);
  const b = normalize(targetNotes);

  // aceita se todas as notas do acorde estiverem presentes
  return b.every((note) => a.includes(note));
};
