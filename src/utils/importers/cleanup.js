// Limpa uma cifra vinda de "copiar e colar", .txt ou PDF: tira cabeçalho, tablatura e
// espaços sobrando, sem mexer no alinhamento entre acorde e letra.
// Devolve { text, key, capo } — tom e capotraste lidos do cabeçalho, quando existem.

// Exige ":" (senão um verso começando com "Tom ..." sumiria), exceto "Capotraste na 2ª casa"
const HEADER =
  /^\s*(?:(tom|afinação|afinacao|capo|capotraste|composição de|composicao de)\s*:|(capotraste)\s)\s*(.*)$/i;
const TAB_LINE = /^\s*[EADGBe]\|/;

const expandTabs = (line) =>
  line.replace(/[^\t]*\t/g, (chunk) => {
    const text = chunk.slice(0, -1);
    return text + " ".repeat(8 - (text.length % 8));
  });

export function cleanCifraText(raw) {
  let key = null;
  let capo = 0;
  const lines = [];

  for (const original of raw.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").split("\n")) {
    const line = expandTabs(original).trimEnd();

    const header = HEADER.exec(line);
    if (header) {
      const label = header[1] ?? header[2];
      const value = header[3];
      if (/^tom/i.test(label)) key = value.trim().split(/\s+/)[0] || null;
      if (/^capo/i.test(label)) capo = Number(value.match(/\d+/)?.[0] ?? 0);
      continue;
    }

    if (TAB_LINE.test(line)) continue;

    lines.push(line);
  }

  const text = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");

  return { text, key, capo: capo >= 1 && capo <= 12 ? capo : 0 };
}
