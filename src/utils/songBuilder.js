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
    const words = block.lyrics.split(" ");
    const step = Math.ceil(words.length / block.chords.length);

    block.chords.forEach((chord, index) => {
      const lyricPart = words.slice(index * step, (index + 1) * step).join(" ");

      song.push({
        chord,
        time,
        lyric: lyricPart,
      });

      time += duration;
    });
  });

  return song;
};
