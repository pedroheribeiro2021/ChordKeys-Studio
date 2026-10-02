import { describe, expect, it } from "vitest";
import { layoutToCifra } from "./layout";
import { cleanCifraText } from "./cleanup";
import { isChordPro, parseChordPro } from "./chordpro";
import { importText } from "./index";

// Letra inventada; a estrutura imita um PDF exportado do Cifra Club
// (fonte de largura fixa, 6,3 pt por caractere, margem em x=28,3).
const CW = 6.3;
const LEFT = 28.3;
const at = (col, y, str, size = 10.5) => ({ str, x: LEFT + col * CW, y, width: str.length * CW, size });
const words = (y, text) =>
  [...text.matchAll(/\S+/g)].map((m) => at(m.index, y, m[0]));

const PAGE_1 = [
  // A extração vem fora de ordem: letra primeiro, títulos e acordes depois
  ...words(632, "Janela de não abrir"),
  ...words(600, "Rua de não passar"),
  ...words(537, "Caneca no balcão"),
  { str: "Música Exemplo", x: LEFT, y: 789, width: 90, size: 15 },
  { str: "Banda Exemplo", x: LEFT, y: 765, width: 80, size: 15 },
  at(0, 703, "Tom:"),
  at(5, 703, "D"),
  at(0, 648, "Bm"),
  at(11, 648, "Ebm7/Bb"),
  at(0, 616, "G7M(13)"),
  at(8, 616, "F#7(#5)"),
];

// Página dos desenhos de acordes: rótulos espalhados e um número de casa
const PAGE_2 = [
  at(5, 780, "Bb°"),
  at(24, 780, "Bm"),
  at(43, 780, "Ebm7/Bb"),
  at(30, 770, "4"),
  at(5, 700, "Gm6"),
];

describe("layoutToCifra", () => {
  const result = layoutToCifra([PAGE_1, PAGE_2]);
  const lines = result.text.split("\n");

  it("lê título e artista pela fonte maior", () => {
    expect(result).toMatchObject({ title: "Música Exemplo", artist: "Banda Exemplo" });
  });

  it("devolve cada acorde à coluna da sílaba", () => {
    expect(lines).toContain("Bm         Ebm7/Bb");
    expect(lines[lines.indexOf("Bm         Ebm7/Bb") + 1]).toBe("Janela de não abrir");
    expect(lines).toContain("G7M(13) F#7(#5)");
  });

  it("separa estrofes por linha em branco", () => {
    const i = lines.indexOf("Caneca no balcão");
    expect(lines[i - 1]).toBe("");
  });

  it("descarta a página de desenhos de acordes", () => {
    expect(lines.at(-1)).toBe("Caneca no balcão");
    expect(result.text).not.toContain("Gm6");
  });

  it("mantém um acorde final que faz parte da cifra", () => {
    const withOutro = layoutToCifra([[...words(632, "Última linha"), at(0, 616, "D")]]);
    expect(withOutro.text).toBe("Última linha\nD");
  });

  it("PDF sem texto devolve vazio", () => {
    expect(layoutToCifra([[]])).toEqual({ text: "", title: "", artist: "" });
  });
});

describe("cleanCifraText", () => {
  it("tira cabeçalho e tablatura, e lê tom e capo", () => {
    const raw = [
      "Composição de: Fulano",
      "Tom: G",
      "Afinação: E A D G B E",
      "Capotraste na 2ª casa",
      "",
      "",
      "",
      "G        D",
      "Um verso qualquer",
      "e|---3---|",
      "B|---0---|",
      "Tomara que dê certo",
    ].join("\r\n");

    expect(cleanCifraText(raw)).toEqual({
      text: "G        D\nUm verso qualquer\nTomara que dê certo",
      key: "G",
      capo: 2,
    });
  });

  it("não apaga verso que começa com a palavra Tom", () => {
    expect(cleanCifraText("Tom de voz baixo").text).toBe("Tom de voz baixo");
  });

  it("troca tab por espaços até a próxima parada de 8", () => {
    expect(cleanCifraText("C\tG").text).toBe("C       G");
  });

  it("troca espaço não separável (comum ao copiar do navegador)", () => {
    expect(cleanCifraText("C  G").text).toBe("C  G");
  });
});

describe("ChordPro", () => {
  const SONG = `{title: Música Exemplo}
{artist: Banda Exemplo}
{key: G}
{capo: 3}
# comentário ignorado
{c: Intro}
[G] [D/F#] [Em]

[G]Um verso [D/F#]qualquer de [Em]teste
{soc}
[C]Refrão
{eoc}`;

  it("detecta o formato", () => {
    expect(isChordPro(SONG)).toBe(true);
    expect(isChordPro("[Intro] C G\n\nC   G\nLetra")).toBe(false);
  });

  it("converte para acorde sobre a letra", () => {
    const result = parseChordPro(SONG);

    expect(result).toMatchObject({ title: "Música Exemplo", artist: "Banda Exemplo", key: "G", capo: 3 });
    expect(result.text.split("\n")).toEqual([
      "[Intro]",
      "G D/F# Em",
      "",
      "G        D/F#        Em",
      "Um verso qualquer de teste",
      "[Refrão]",
      "C",
      "Refrão",
    ]);
  });

  it("acordes colados não se sobrepõem", () => {
    expect(parseChordPro("{t: x}\n[C7M(9)][G]Oi").text).toBe("C7M(9) G\nOi");
  });

  it("colchete que não é acorde vira texto", () => {
    expect(parseChordPro("{t: x}\n[Ponte] [C]Lá").text).toBe("        C\n[Ponte] Lá");
  });
});

describe("importText", () => {
  it("limpa texto comum", () => {
    expect(importText("Tom: A\n\nA   E\nLetra")).toMatchObject({ text: "A   E\nLetra", key: "A" });
  });

  it("converte ChordPro e preserva os metadados", () => {
    expect(importText("{title: T}\n{capo: 2}\n[C]Oi [G]tchau")).toMatchObject({
      title: "T",
      capo: 2,
      text: "C  G\nOi tchau",
    });
  });
});
