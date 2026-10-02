import { isChord } from "../chordUtils";

// ChordPro: formato padrão de cifra com o acorde no meio da letra ([C]Quando a [G]luz)
// e diretivas entre chaves ({title: ...}). Convertido para acorde-sobre-letra.

const DIRECTIVE = /^\s*\{\s*([\w-]+)\s*(?::\s*(.*?))?\s*\}\s*$/;
const INLINE_CHORD = /\[([^\]]+)\]/g;

const SECTION_LABELS = {
  start_of_chorus: "Refrão",
  soc: "Refrão",
  start_of_verse: "Verso",
  sov: "Verso",
  start_of_bridge: "Ponte",
  sob: "Ponte",
};

// Só é ChordPro se tiver diretiva ou acorde colado na letra; "[Intro] C G" (Cifra Club) não é
export function isChordPro(text) {
  if (/^\s*\{\s*(title|t|subtitle|st|artist|start_of_chorus|soc|key|capo)\b/im.test(text)) return true;

  const inlineLines = text
    .split("\n")
    .filter((line) => [...line.matchAll(/\[([^\]]+)\]\S/g)].some((m) => isChord(m[1])));
  return inlineLines.length >= 2;
}

// "[C]Quando a [G]luz" → ["C       G", "Quando a luz"]
function splitInlineLine(line) {
  let chords = "";
  let lyrics = "";
  let last = 0;

  for (const match of line.matchAll(INLINE_CHORD)) {
    lyrics += line.slice(last, match.index);
    last = match.index + match[0].length;

    // [Intro], [Refrão]: não é acorde, fica como texto
    if (!isChord(match[1])) {
      lyrics += match[0];
      continue;
    }

    const col = chords.length === 0 ? lyrics.length : Math.max(lyrics.length, chords.length + 1);
    chords = chords.padEnd(col) + match[1];
  }
  lyrics += line.slice(last);

  return lyrics.trim() ? [chords, lyrics.trimEnd()] : [chords];
}

export function parseChordPro(text) {
  const meta = { title: "", artist: "", key: null, capo: 0 };
  const out = [];
  let inTab = false;

  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const directive = DIRECTIVE.exec(line);

    if (directive) {
      const name = directive[1].toLowerCase();
      const value = directive[2] ?? "";

      if (name === "title" || name === "t") meta.title = value;
      else if (["subtitle", "st", "artist"].includes(name)) meta.artist ||= value;
      else if (name === "key") meta.key = value;
      else if (name === "capo") meta.capo = Number(value) || 0;
      else if (["comment", "c", "ci", "cb", "comment_italic", "comment_box"].includes(name)) out.push(`[${value}]`);
      else if (SECTION_LABELS[name]) out.push(`[${value || SECTION_LABELS[name]}]`);
      else if (name === "start_of_tab" || name === "sot") inTab = true;
      else if (name === "end_of_tab" || name === "eot") inTab = false;
      continue;
    }

    if (inTab || line.trimStart().startsWith("#")) continue;

    out.push(...(line.includes("[") ? splitInlineLine(line) : [line]));
  }

  return {
    // Só tira linhas vazias das pontas: o recuo da 1ª linha de acordes é a coluna dela
    text: out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\s*\n|\s+$/g, ""),
    ...meta,
  };
}
