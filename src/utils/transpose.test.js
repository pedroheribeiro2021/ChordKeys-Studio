import { describe, expect, it } from "vitest";
import { transposeChord } from "./transpose";

describe("transposeChord", () => {
  it("mantém o sufixo", () => {
    expect(transposeChord("C7M(9)", 2)).toBe("D7M(9)");
    expect(transposeChord("F#m7(b5)", -1)).toBe("Fm7(b5)");
  });

  it("transpõe o baixo junto", () => {
    expect(transposeChord("D/F#", 2)).toBe("E/G#");
  });

  it("mantém bemol quando o original usa bemol", () => {
    expect(transposeChord("Bb", 2)).toBe("C");
    expect(transposeChord("Bb", 1)).toBe("B");
    expect(transposeChord("Eb", -1)).toBe("D");
    expect(transposeChord("Ab7", 1)).toBe("A7");
    expect(transposeChord("Eb", 1)).toBe("E");
    expect(transposeChord("Db", 2)).toBe("Eb");
  });

  it("dá a volta na oitava", () => {
    expect(transposeChord("B", 1)).toBe("C");
    expect(transposeChord("C", -1)).toBe("B");
    expect(transposeChord("G", 12)).toBe("G");
  });

  it("devolve texto que não é acorde sem mudar", () => {
    expect(transposeChord("[Intro]", 3)).toBe("[Intro]");
  });
});
