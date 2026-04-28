export const buildSong = (chords, duration = 1) => {
  return chords.map((chord, index) => ({
    time: index * duration,
    chord,
  }));
};

export const buildSongFromLyrics = (parsed, duration = 1) => {
  let time = 0;
  const song = [];

  parsed.forEach((block) => {
    block.chords.forEach((chord) => {
      song.push({
        chord,
        time,
        lyric: block.lyrics,
      });

      time += duration;
    });
  });

  return song;
};
