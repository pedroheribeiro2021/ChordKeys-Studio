import { cleanCifraText } from "./cleanup";
import { isChordPro, parseChordPro } from "./chordpro";

// Resultado comum de todo import: { text, title, artist, key, capo }

export const ACCEPTED_FILES = ".txt,.text,.cho,.chopro,.chordpro,.crd,.pro,.pdf,text/plain,application/pdf";

const CHORDPRO_EXT = /\.(cho|chopro|chordpro|crd|pro)$/i;

// Texto colado ou de arquivo: ChordPro é convertido; o resto só é limpo
export function importText(raw) {
  if (isChordPro(raw)) {
    const parsed = parseChordPro(raw);
    const { text, key, capo } = cleanCifraText(parsed.text);
    return { ...parsed, text, key: parsed.key ?? key, capo: parsed.capo || capo };
  }
  return { title: "", artist: "", ...cleanCifraText(raw) };
}

// .txt salvo no Windows costuma vir em ANSI (Windows-1252), não UTF-8
async function readTextFile(file) {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  return utf8.includes("\uFFFD") ? new TextDecoder("windows-1252").decode(buffer) : utf8;
}

const titleFromFileName = (name) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/\s*-\s*Cifra Club.*$/i, "")
    .trim();

export async function importFile(file) {
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    const { importPdf } = await import("./pdf");
    const fromPdf = await importPdf(new Uint8Array(await file.arrayBuffer()));
    const cleaned = cleanCifraText(fromPdf.text);
    return {
      ...cleaned,
      title: fromPdf.title || titleFromFileName(file.name),
      artist: fromPdf.artist,
    };
  }

  const raw = await readTextFile(file);
  const result = CHORDPRO_EXT.test(file.name)
    ? { ...parseChordPro(raw) }
    : importText(raw);

  return { ...result, title: result.title || titleFromFileName(file.name) };
}
