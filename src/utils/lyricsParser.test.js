import { describe, expect, it } from "vitest";
import { isChordLine, parseLyricsWithChords } from "./lyricsParser";
import { parseChords } from "./parser";
import { buildSongFromLyrics, getSongBeats } from "./songBuilder";

const CIFRA = `[Intro] C  G/B  Am7  F7M

C              G/B
Quando a luz dos olhos meus
Am7                 F7M
E a luz dos olhos teus

[Refrão]
F#m7(b5)  B7
Resolvem se encontrar`;

describe("isChordLine", () => {
  it("reconhece linhas de acorde com marcadores e tétrades", () => {
    expect(isChordLine("[Intro] C  G/B  Am7  F7M")).toBe(true);
    expect(isChordLine("F#m7(b5)  B7")).toBe(true);
    expect(isChordLine("C  G  (2x)")).toBe(true);
  });

  it("não confunde letra com acorde", () => {
    expect(isChordLine("Quando a luz dos olhos meus")).toBe(false);
    expect(isChordLine("A E C")).toBe(true);
    expect(isChordLine("A casa é sua")).toBe(false);
  });
});

describe("parseLyricsWithChords", () => {
  const blocks = parseLyricsWithChords(CIFRA);

  it("linha de acordes seguida de linha em branco não consome letra", () => {
    expect(blocks[0].chords.map((c) => c.chord)).toEqual(["C", "G/B", "Am7", "F7M"]);
    expect(blocks[0].lyrics).toBe("");
  });

  it("associa a letra da linha de baixo", () => {
    expect(blocks[1].lyrics).toBe("Quando a luz dos olhos meus");
    expect(blocks[3].chords.map((c) => c.chord)).toEqual(["F#m7(b5)", "B7"]);
  });

  it("ignora marcadores de seção", () => {
    expect(blocks.flatMap((b) => b.chords).some((c) => c.chord.startsWith("["))).toBe(false);
  });
});

describe("buildSongFromLyrics", () => {
  it("corta a letra no início da palavra onde o acorde cai", () => {
    const song = buildSongFromLyrics(parseLyricsWithChords(CIFRA), 2);
    const quando = song.filter((s) => s.lyric).slice(0, 2);

    expect(quando).toEqual([
      { chord: "C", beat: 8, lyric: "Quando a luz" },
      { chord: "G/B", beat: 10, lyric: "dos olhos meus" },
    ]);
  });

  it("calcula o total de batidas", () => {
    const song = buildSongFromLyrics(parseLyricsWithChords(CIFRA), 2);
    expect(getSongBeats(song, 2)).toBe(song.length * 2);
  });
});

describe("parseChords", () => {
  it("lê listas simples sem pegar letras soltas de palavras", () => {
    expect(parseChords("C G Am F")).toEqual(["C", "G", "Am", "F"]);
    expect(parseChords("| C7M | Dm7 | G7(9) |")).toEqual(["C7M", "Dm7", "G7(9)"]);
    expect(parseChords("Amor")).toEqual([]);
  });
});
