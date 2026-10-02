// Cada item da música: { chord, beat, lyric? }. `beat` é a posição em batidas,
// então a velocidade real depende do BPM do Transport.
export const buildSong = (chords, beatsPerChord = 2) => {
  return chords.map((chord, index) => ({
    beat: index * beatsPerChord,
    chord,
  }));
};

// O acorde cai na sílaba, muitas vezes no meio da palavra; o corte recua até o início dela
const wordStart = (text, col) => {
  let start = Math.min(col, text.length);
  while (start > 0 && !/\s/.test(text[start - 1])) start--;
  return start;
};

export const buildSongFromLyrics = (parsed, beatsPerChord = 2) => {
  const song = [];

  parsed.forEach((block) => {
    block.chords.forEach(({ chord, col }, index) => {
      const next = block.chords[index + 1];
      const start = index === 0 ? 0 : wordStart(block.lyrics, col);
      const end = next ? wordStart(block.lyrics, next.col) : block.lyrics.length;

      song.push({
        chord,
        beat: song.length * beatsPerChord,
        lyric: block.lyrics.slice(start, end).trim(),
      });
    });
  });

  return song;
};

export const getSongBeats = (song, beatsPerChord) =>
  song.length === 0 ? 0 : song[song.length - 1].beat + beatsPerChord;
