import { describe, expect, it } from "vitest";
import { getChordNotes, getIntervals, isChord, parseChord } from "./chordUtils";

const pitchClasses = (chord) => getChordNotes(chord).map((n) => n.replace(/\d/g, ""));

describe("parseChord", () => {
  it("separa fundamental, sufixo e baixo", () => {
    expect(parseChord("F#m7(b5)")).toEqual({ root: "F#", suffix: "m7(b5)", bass: null });
    expect(parseChord("D/F#")).toEqual({ root: "D", suffix: "", bass: "F#" });
    expect(parseChord("Bb7M")).toEqual({ root: "Bb", suffix: "7M", bass: null });
  });

  it("rejeita palavras comuns da letra", () => {
    for (const word of ["Amor", "Bem", "Do", "Eu", "[Intro]", "Agora"]) {
      expect(isChord(word)).toBe(false);
    }
  });
});

describe("getIntervals", () => {
  it.each([
    ["", [0, 4, 7]],
    ["m", [0, 3, 7]],
    ["7", [0, 4, 7, 10]],
    ["7M", [0, 4, 7, 11]],
    ["maj7", [0, 4, 7, 11]],
    ["m7", [0, 3, 7, 10]],
    ["m7(b5)", [0, 3, 6, 10]],
    ["º", [0, 3, 6]],
    ["dim", [0, 3, 6]],
    ["º7", [0, 3, 6, 9]],
    ["aug", [0, 4, 8]],
    ["sus4", [0, 5, 7]],
    ["sus2", [0, 2, 7]],
    ["6", [0, 4, 7, 9]],
    ["add9", [0, 4, 7, 14]],
    ["9", [0, 4, 7, 10, 14]],
    ["7(9)", [0, 4, 7, 10, 14]],
    ["7M(9)", [0, 4, 7, 11, 14]],
    ["7(b9)", [0, 4, 7, 10, 13]],
    ["7(#11)", [0, 4, 7, 10, 18]],
  ])("sufixo %j", (suffix, expected) => {
    expect(getIntervals(suffix)).toEqual(expected);
  });
});

describe("getChordNotes", () => {
  it("entende bemóis", () => {
    expect(pitchClasses("Bb")).toEqual(["A#", "D", "F"]);
    expect(pitchClasses("Ebm")).toEqual(["D#", "F#", "A#"]);
  });

  it("coloca o baixo invertido embaixo", () => {
    expect(getChordNotes("D/F#")).toEqual(["F#2", "D3", "A3"]);
  });

  it("ordena do grave para o agudo", () => {
    expect(getChordNotes("A")).toEqual(["A3", "C#4", "E4"]);
  });

  it("inversão sobe a nota mais grave uma oitava", () => {
    expect(getChordNotes("C", true)).toEqual(["E3", "G3", "C4"]);
  });

  it("devolve vazio para texto que não é acorde", () => {
    expect(getChordNotes("Amor")).toEqual([]);
  });
});
