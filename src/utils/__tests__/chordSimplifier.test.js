import { describe, expect, it } from "vitest";
import { simplifyChordSmart } from "../chordSimplifier";

describe("simplifyChordSmart for repertoire-aware chords", () => {
  it.each([
    ["E9", {}, "E9", "original"],
    ["G#m/B", {}, "G#m/B", "keep-inversion"],
    ["Gº", {}, "Gº", "keep-diminished"],
    ["B7(2)", {}, "B7", "reduce-tensions"],
    ["B7(9-)", {}, "B7(9-)", "original"],
    ["Bm11", {}, "Bm7", "reduce-tensions"],
    ["A7M(9)", {}, "A7M", "reduce-tensions"],
    ["Am9", {}, "Am7", "reduce-tensions"],
    ["D7(9/11+)", {}, "D7", "reduce-tensions"],
    ["E/G#", {}, "E/G#", "keep-inversion"],
    ["C#m7", {}, "C#m7", "original"],
    ["Cº", {}, "Cº", "keep-diminished"],
  ])("%s -> %s", (original, context, expected, reason) => {
    const result = simplifyChordSmart(original, { difficulty: "fiel", ...context });
    expect(result.options[0]).toMatchObject({ chord: expected, reason });
  });

  it("reduces a compound altered dominant to a playable dominant without losing its seventh", () => {
    const result = simplifyChordSmart("E7(9-/13)", { difficulty: "fiel" });
    expect(result.options[0]).toMatchObject({
      chord: expect.stringMatching(/^E7(?:\(b9\))?$/),
      reason: "reduce-tensions",
    });
  });

  it("keeps chromatic passing diminished chords when neighboring basses form a semitone line", () => {
    const result = simplifyChordSmart("Gº", {
      contextBefore: "G#m/B",
      contextAfter: "F#m7",
    });
    expect(result.options[0]).toMatchObject({ chord: "Gº", reason: "keep-diminished" });
  });

  it("does not reduce a bossa ninth or sixth to a plain triad in faithful mode", () => {
    for (const chord of ["E9", "A7M(9)", "D6/9", "C#m7"]) {
      const { options } = simplifyChordSmart(chord, {
        difficulty: "fiel",
        repertoire: "bossa",
      });
      const first = options[0]?.chord ?? "";
      expect(first).not.toMatch(/^(?:[A-G][#b]?)(?:m)?$/);
    }
  });

  it("only transposes bossa/MPB chords as separate, opt-in candidates", () => {
    const result = simplifyChordSmart("F#m7", {
      key: "E",
      repertoire: "bossa",
      difficulty: "facil",
    });
    expect(result.options.some((option) => option.reason === "transpose-to-guitar-key" && option.transpose)).toBe(true);
  });
});

describe("whole-song guitar-key suggestions", () => {
  it("suggests a global shift to an easy guitar key without applying it", async () => {
    const { suggestGuitarTranspose } = await import("../chordSimplifier");
    const result = suggestGuitarTranspose(["F#m7", "B7", "E7M"], {
      key: "F#",
      repertoire: "bossa",
    });
    expect(result).toMatchObject({
      target: expect.any(String),
      shift: expect.any(Number),
      highBarres: 0,
    });
  });

  it("keeps extended harmony in faithful mode across synthetic progressions in E", () => {
    const progressions = [
      { repertoire: "bossa", chords: ["E7M(9)", "A7M", "F#m7", "B7(9)"] },
      { repertoire: "mpb", chords: ["C#m7", "F#7", "B7M(9)", "E6/9"] },
      { repertoire: "samba", chords: ["A7M(9)", "G#m7", "C#7(9)", "F#m7"] },
      { repertoire: "rock", chords: ["E", "A", "B7", "E"] },
      { repertoire: "rock", chords: ["E5", "A5", "B5", "E5"] },
      { repertoire: "pop", chords: ["Esus4", "E", "Aadd9", "B7"] },
    ];
    for (const { repertoire, chords } of progressions) {
      const faithful = chords.map((chord) =>
        simplifyChordSmart(chord, {
          key: "E",
          difficulty: "fiel",
          repertoire,
        }).options[0]?.chord,
      );
      chords.forEach((chord, index) => {
        if (/(?:7M|maj7|m7|(?:^|[^b#])9|6)/.test(chord)) {
          expect(faithful[index]).not.toMatch(/^[A-G][#b]?m?$/);
        }
      });
    }
  });
});
