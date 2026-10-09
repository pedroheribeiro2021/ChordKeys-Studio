import { describe, expect, it } from "vitest";
import { detectRepertoire, repertoireProfile } from "../repertoire";

describe("detectRepertoire", () => {
  it("detects bossa/MPB harmony from major sevenths, ninths, and diminished chords", () => {
    const chordSheet = "E7M A7M F#m7 Bm7 E7(9) C#m7(b5) Dº";
    expect(["bossa", "mpb"]).toContain(detectRepertoire(chordSheet));
  });

  it("recognizes rock and pop markers without treating lyrics as chords", () => {
    expect(detectRepertoire("G5 D5 C5 G5 Asus4 Dsus4")).toBe("rock");
    expect(detectRepertoire("Cadd9 Gadd9 Dsus4 Cadd9")).toBe("pop");
  });

  it("returns unknown when no confident harmonic pattern is present", () => {
    expect(detectRepertoire("C G Am F")).toBe("unknown");
    expect(detectRepertoire("[Intro] letra comum")).toBe("unknown");
  });

  it("does not count chord-like words from lyric lines as harmony markers", () => {
    expect(detectRepertoire("E7M A7M\nA vida é boa para cantar")).toBe("bossa");
    expect(detectRepertoire("A vida é boa para cantar sem cifras")).toBe("unknown");
  });

  it("exposes distinct strategy weights for each repertoire profile", () => {
    expect(repertoireProfile.bossa.reduceTensions).toBeLessThan(
      repertoireProfile.rock.reduceTensions,
    );
    expect(repertoireProfile.bossa.keepPassingDiminished).toBeGreaterThan(
      repertoireProfile.rock.keepPassingDiminished,
    );
  });
});
