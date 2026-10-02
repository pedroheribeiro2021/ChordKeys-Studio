import { describe, expect, it } from "vitest";
import { formatSheet, sheetChords } from "./sheet";
import { transposeChord } from "./transpose";

const asText = (lines) =>
  lines.map((l) => (l.type === "text" ? l.text : l.parts.map((p) => p.text).join(""))).join("\n");

const CIFRA = `[Intro] C  G/B

C              G/B
Quando a luz dos olhos meus`;

describe("formatSheet", () => {
  it("sem transformação, devolve o mesmo texto", () => {
    expect(asText(formatSheet(CIFRA))).toBe(CIFRA);
  });

  it("mantém a coluna do acorde quando o nome muda de tamanho", () => {
    const lines = formatSheet("C              G/B", (c) => transposeChord(c, 1));
    expect(asText(lines)).toBe("C#             G#/C");
  });

  it("empurra o próximo acorde quando não há espaço", () => {
    const lines = formatSheet("C D", () => "C7M(9)");
    expect(asText(lines)).toBe("C7M(9) C7M(9)");
  });

  it("marca acordes e deixa marcadores e letra como texto", () => {
    const [intro, , chords, lyric] = formatSheet(CIFRA);
    expect(intro.parts.filter((p) => p.chord).map((p) => p.chord)).toEqual(["C", "G/B"]);
    expect(intro.parts[0]).toEqual({ text: "[Intro]" });
    expect(chords.type).toBe("chords");
    expect(lyric).toEqual({ type: "text", text: "Quando a luz dos olhos meus" });
  });

  it("lista os acordes únicos na ordem", () => {
    expect(sheetChords(formatSheet(CIFRA))).toEqual(["C", "G/B"]);
  });
});
