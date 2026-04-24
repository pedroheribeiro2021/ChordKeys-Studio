export const buildSong = (chords, duration = 2) => {
  return chords.map((chord, index) => ({
    time: index * duration,
    chord,
  }));
};
