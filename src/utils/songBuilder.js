export const buildSong = (chords, duration = 1) => {
  return chords.map((chord, index) => ({
    time: index * duration,
    chord,
  }));
};
