import { describe, expect, it } from "vitest";
import { NOTES, getIntervals, noteIndex } from "./chordUtils";
import {
  getGuitarShape,
  needsBarre,
  shapePitchClasses,
  shapeQuality,
  simplifyChord,
  simplifyChordSmart,
  suggestCapo,
  TUNING,
} from "./guitar";

const QUALITIES = ["", "m", "7", "m7", "7M", "sus4", "sus2", "dim", "m7(b5)", "aug"];

const chordPitchClasses = (root, quality) =>
  getIntervals(quality).map((i) => (noteIndex(root) + i) % 12);

describe("getGuitarShape", () => {
  // Confere a música de cada desenho: um erro de casa no dicionário quebra aqui
  for (const root of NOTES) {
    for (const quality of QUALITIES) {
      const chord = `${root}${quality}`;

      it(`${chord} soa as notas do acorde`, () => {
        const shape = getGuitarShape(chord);
        expect(shape, chord).not.toBeNull();

        const expected = chordPitchClasses(root, quality);
        const played = shapePitchClasses(shape.frets);

        for (const pc of played) expect(expected, `${chord}: nota estranha ${NOTES[pc]}`).toContain(pc);
        expect(played, `${chord}: sem fundamental`).toContain(expected[0]);
        expect(played, `${chord}: sem terça/sus`).toContain(expected[1]);
        expect(shape.frets.filter((f) => f >= 0).length).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it("usa acorde aberto quando existe", () => {
    expect(getGuitarShape("C")).toEqual({ frets: [-1, 3, 2, 0, 1, 0], barre: null, quality: "" });
    expect(needsBarre("Em7")).toBe(false);
  });

  it("monta pestana na casa mais baixa", () => {
    expect(getGuitarShape("F")).toMatchObject({ frets: [1, 3, 3, 2, 1, 1], barre: 1 });
    expect(getGuitarShape("Bm")).toMatchObject({ frets: [-1, 2, 4, 4, 3, 2], barre: 2 });
  });

  it("entende bemóis e constrói uma inversão quando o shape aberto não contém o baixo", () => {
    expect(getGuitarShape("Bb")).toMatchObject({ barre: 1 });
    expect(getGuitarShape("D/F#")).toMatchObject({ frets: [2, -1, 0, 2, 3, 2] });
    const inversion = getGuitarShape("D7M/A").frets;
    const bassString = inversion.findIndex((fret) => fret >= 0);
    expect((TUNING[bassString] + inversion[bassString]) % 12).toBe(noteIndex("A"));
  });

  it("devolve null para texto que não é acorde", () => {
    expect(getGuitarShape("[Intro]")).toBeNull();
  });
});

describe("shapeQuality", () => {
  it.each([
    ["7(9)", "7"],
    ["7M(9)", "7M"],
    ["add9", ""],
    ["6", ""],
    ["m6", "m"],
    ["º7", "dim"],
    ["ø", "m7(b5)"],
    ["7sus4", "sus4"],
  ])("%j → %j", (suffix, expected) => {
    expect(shapeQuality(suffix)).toBe(expected);
  });
});

describe("simplifyChord", () => {
  it.each([
    ["C7M(9)", "C"],
    ["F#m7(b5)", "F#m"],
    ["D/F#", "D"],
    ["G7sus4", "G"],
    ["Bbm7", "Bbm"],
    ["Bº", "Bº"],
    ["A7(13)", "A"],
    ["[Intro]", "[Intro]"],
  ])("%s → %s", (chord, expected) => {
    expect(simplifyChord(chord)).toBe(expected);
  });
});

describe("simplifyChordSmart", () => {
  it("preserva inversões e extensões na opção mais fiel", () => {
    const result = simplifyChordSmart("D7M/A", { key: "D", difficulty: "fiel" });

    expect(result.original).toBe("D7M/A");
    expect(result.options[0].chord).toBe("D7M/A");
    expect(result.options.every((option) => option.score >= 0 && option.score <= 100)).toBe(true);
    expect(result.options.map((option) => option.score)).toEqual(
      [...result.options].map((option) => option.score).sort((a, b) => b - a),
    );
  });

  it("preserva o diminuto cromático entre dois acordes", () => {
    const result = simplifyChordSmart("G°", {
      contextBefore: "G#m/B",
      contextAfter: "F#m7",
    });

    expect(result.options[0]).toMatchObject({ chord: "G°", reason: "keep-diminished" });
  });

  it("marca meio-diminuto como substituição funcional menor", () => {
    const result = simplifyChordSmart("F#m7(b5)", { key: "E" });

    expect(result.options.find((option) => option.chord === "F#m").reason).toBe(
      "functional-substitute",
    );
  });

  it("mantém a sétima dominante quando o sus4 resolve no dominante do mesmo acorde", () => {
    const result = simplifyChordSmart("D7sus4", { contextAfter: "D7" });

    expect(result.options.find((option) => option.chord === "D7").reason).toBe(
      "sus-resolution",
    );
  });

  it("propõe dominante do próximo acorde para acorde menor cromático", () => {
    const result = simplifyChordSmart("Ebm7/Bb", {
      key: "D",
      contextAfter: "Bm",
    });

    expect(result.options.find((option) => option.chord === "F#7")).toMatchObject({
      chord: "F#7",
      reason: "dominant-of-next",
      shape: "242322",
    });
  });

  it.each([
    ["G7M(13)", "G7M"],
    ["Gm6", "Gm6"],
    ["F#7(#5)", "F#7"],
  ])("simplifica %s para %s", (chord, expected) => {
    expect(simplifyChordSmart(chord).options[0].chord).toBe(expected);
  });

  it("devolve nenhuma alternativa para texto que não é acorde", () => {
    expect(simplifyChordSmart("[Intro]")).toEqual({ original: "[Intro]", options: [] });
  });

  it("respeita os shapes permitidos e o nível de habilidade", () => {
    const result = simplifyChordSmart("D7M/A", {
      allowedShapes: ["xx0232"],
      userSkill: "iniciante",
    });

    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options.every((option) => option.shape === "xx0232")).toBe(true);
  });

  it("retorna somente alternativas com shape permitido", () => {
    const result = simplifyChordSmart("D7M/A", {
      allowedShapes: ["xx0232"],
      userSkill: "iniciante",
    });
    expect(result.options.length).toBeGreaterThan(0);
    expect(result.options.every((option) => option.shape === "xx0232")).toBe(true);
  });
});

describe("suggestCapo", () => {
  it("em Fá, sugere capo na 3ª tocando como Ré (só o Bm fica com pestana)", () => {
    const result = suggestCapo(["F", "Bb", "C", "Dm"]);
    expect(result).toEqual({ capo: 3, barres: 1, barresWithoutCapo: 2 });
  });

  it("em Fá#, capo na 4ª elimina todas as pestanas", () => {
    expect(suggestCapo(["F#", "B", "C#"])).toMatchObject({ capo: 4, barres: 0 });
  });

  it("não sugere capo quando já não há pestana", () => {
    expect(suggestCapo(["C", "G", "Am", "F7M"])).toMatchObject({ capo: 0, barres: 0 });
  });

  it("prefere a casa mais baixa em caso de empate", () => {
    // F: capo 1 (formato E) e capo 3 (formato D) zeram a pestana
    expect(suggestCapo(["F"])).toMatchObject({ capo: 1, barres: 0 });
  });
});
