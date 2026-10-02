import { isChord } from "../chordUtils";

// Reconstrói o texto de uma cifra a partir de trechos posicionados (como os que o
// pdf.js extrai). A extração "em ordem" do PDF embaralha tudo: letra, depois título,
// depois acordes. Aqui cada trecho volta para a sua linha (pelo y) e coluna (pelo x),
// o que recupera o acorde em cima da sílaba certa.
//
// pages: [[{ str, x, y, width, size }]] — y cresce para cima, como no PDF.

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

const isChordOrNumber = (token) => isChord(token) || /^\d+$/.test(token);

const isChordOnlyLine = (line) => {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every(isChordOrNumber);
};

export function layoutToCifra(pages) {
  const items = pages.flatMap((page, pageIndex) =>
    page.filter((it) => it.str.trim()).map((it) => ({ ...it, page: pageIndex })),
  );
  if (items.length === 0) return { text: "", title: "", artist: "" };

  // Corpo da cifra = tamanho de fonte mais comum; títulos usam fonte maior
  const bodySize = median(items.map((it) => Math.round(it.size * 2) / 2));
  const body = items.filter((it) => it.size <= bodySize * 1.15);
  const headings = items
    .filter((it) => it.size > bodySize * 1.15)
    .sort((a, b) => a.page - b.page || b.y - a.y);

  const charWidth = median(
    body.filter((it) => it.str.length >= 2).map((it) => it.width / it.str.length),
  ) || bodySize * 0.6;
  const left = Math.min(...body.map((it) => it.x));

  // Agrupa em linhas: mesma página e y próximo
  const lines = [];
  for (const it of [...body].sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x)) {
    const line = lines.at(-1);
    if (line && line.page === it.page && Math.abs(line.y - it.y) < bodySize * 0.5) {
      line.items.push(it);
    } else {
      lines.push({ page: it.page, y: it.y, items: [it] });
    }
  }

  // Espaçamento normal entre linhas; um salto maior vira linha em branco
  const gaps = lines
    .slice(1)
    .filter((l, i) => l.page === lines[i].page)
    .map((l, i) => lines[i].y - l.y)
    .filter((g) => g > 0);
  const lineHeight = Math.min(...gaps.filter((g) => g >= bodySize), bodySize * 1.5) || bodySize * 1.5;

  const out = [];
  lines.forEach((line, index) => {
    const prev = lines[index - 1];
    const gap = prev ? (prev.page === line.page ? prev.y - line.y : Infinity) : 0;
    out.push({ text: renderLine(line.items, left, charWidth), gap });
  });

  // Desenhos de acordes no fim (rótulos e números de casa) não são cifra:
  // corta o bloco final só de acordes, a partir da quebra de página/seção mais alta dele.
  let end = out.length;
  for (let i = out.length - 1; i > 0 && isChordOnlyLine(out[i].text); i--) {
    if (out[i].gap > lineHeight * 2.5) end = i;
  }

  const text = out
    .slice(0, end)
    .map(({ text: t, gap }, i) => (i > 0 && gap > lineHeight * 1.5 ? `\n${t}` : t))
    .join("\n");

  return {
    text,
    title: headings[0]?.str.trim() ?? "",
    artist: headings[1]?.str.trim() ?? "",
  };
}

// Coloca cada trecho na coluna que corresponde ao seu x, com pelo menos um espaço entre eles
function renderLine(items, left, charWidth) {
  let text = "";
  for (const it of [...items].sort((a, b) => a.x - b.x)) {
    const col = Math.max(0, Math.round((it.x - left) / charWidth));
    const start = text.length === 0 ? col : Math.max(col, text.length + 1);
    text = text.padEnd(start) + it.str.trim();
  }
  return text;
}
