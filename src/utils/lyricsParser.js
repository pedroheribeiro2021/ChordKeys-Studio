export const parseLyricsWithChords = (text) => {
  const lines = text.split("\n");

  const result = [];

  const chordRegex = /^[A-G](#|b)?(m|maj|min|dim|aug|sus)?\d*$/;

  const isChordLine = (line) => {
    const tokens = line.trim().split(/\s+/);

    if (tokens.length === 0) return false;

    // conta quantos tokens são acordes válidos
    const chordCount = tokens.filter((token) => chordRegex.test(token)).length;

    // ignorar linhas com palavras longas (provavelmente letra)
    const hasLongWord = tokens.some((t) => t.length > 5);
    if (hasLongWord) return false;

    // 🔥 regra principal:
    return chordCount > 0 && chordCount >= tokens.length * 0.6;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    if (isChordLine(line)) {
      // separa acordes colados (tipo C#mC#m)
      const cleaned = line.replace(
        /([A-G](#|b)?(m|maj|min|dim|aug|sus)?\d*)/g,
        "$1 ",
      );
      const chords = cleaned.trim().split(/\s+/);

      const lyrics = lines[i + 1] || "";

      result.push({
        chords,
        lyrics,
      });

      i++;
    }
  }

  return result;
};
