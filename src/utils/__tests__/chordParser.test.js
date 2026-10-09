import { describe, expect, it } from "vitest";
import { formatChord, parseChord } from "../chordParser";

describe("chordParser", () => {
  it("separates root, quality, seventh, extensions and bass", () => {
    expect(parseChord("A7M(9)/G#")).toMatchObject({
      root: "A",
      quality: "major",
      seventh: "major",
      extensions: ["9"],
      bass: "G#",
      raw: "A7M(9)/G#",
    });
  });

  it.each([
    ["C7M", "major", "major"],
    ["F#m7(b5)", "half-diminished", "minor"],
    ["Bb°", "diminished", null],
    ["G+", "augmented", null],
    ["Dsus4", "sus4", null],
  ])("parses %s", (chord, quality, seventh) => {
    expect(parseChord(chord)).toMatchObject({ quality, seventh });
  });

  it("formats structured chord metadata and preserves inversion", () => {
    expect(formatChord({
      root: "A",
      quality: "major",
      seventh: "major",
      extensions: [],
      alterations: [],
      bass: "G#",
    })).toBe("A7M/G#");
  });

  it("formats 6/9 and altered extensions without merging their degrees", () => {
    expect(formatChord(parseChord("D6/9"))).toBe("D6/9");
    expect(formatChord(parseChord("E7(9-/13)"))).toBe("E7(9-/13)");
  });

  it("returns null for non-chord input", () => {
    expect(parseChord("[Verse]")).toBeNull();
  });
});
