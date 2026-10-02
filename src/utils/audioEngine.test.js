import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Tone.js simulado: registra o que o teclado manda para o sintetizador
const calls = [];
vi.mock("tone", () => {
  class PolySynth {
    toDestination() {
      return this;
    }
    triggerAttack(note) {
      calls.push(["attack", note]);
    }
    triggerRelease(note) {
      calls.push(["release", note]);
    }
    triggerAttackRelease(note) {
      calls.push(["short", note]);
    }
  }
  return { start: async () => {}, PolySynth, Synth: class {}, getTransport: () => ({}) };
});

const engine = await import("./audioEngine");
const { noteOn, noteOff, setSustain, getSustain } = engine;

beforeEach(async () => {
  setSustain(false);
  await engine.initAudio();
  calls.length = 0;
});

afterEach(() => vi.useRealTimers());

describe("teclado sem sustain", () => {
  it("a nota soa enquanto a tecla está apertada", async () => {
    await noteOn("C4");
    expect(calls).toEqual([["attack", "C4"]]);

    noteOff("C4");
    expect(calls).toEqual([["attack", "C4"], ["release", "C4"]]);
  });

  it("apertar de novo a mesma nota reinicia o som", async () => {
    await noteOn("E4");
    await noteOn("E4");
    expect(calls).toEqual([["attack", "E4"], ["release", "E4"], ["attack", "E4"]]);
  });
});

describe("teclado com sustain", () => {
  it("soltar a tecla não corta a nota", async () => {
    setSustain(true);
    await noteOn("G4");
    noteOff("G4");
    expect(calls).toEqual([["attack", "G4"]]);
    expect(getSustain()).toBe(true);
  });

  it("desligar o sustain corta as notas soltas e mantém as apertadas", async () => {
    setSustain(true);
    await noteOn("C4");
    await noteOn("E4");
    noteOff("C4");
    calls.length = 0;

    setSustain(false);
    expect(calls).toEqual([["release", "C4"]]);

    noteOff("E4");
    expect(calls).toEqual([["release", "C4"], ["release", "E4"]]);
  });

  it("libera sozinha a voz da nota que já decaiu (limite de vozes do sintetizador)", async () => {
    vi.useFakeTimers();
    setSustain(true);
    await noteOn("A4");
    noteOff("A4");

    vi.advanceTimersByTime(2000);
    expect(calls).toEqual([["attack", "A4"]]);

    vi.advanceTimersByTime(1500);
    expect(calls).toEqual([["attack", "A4"], ["release", "A4"]]);
  });

  it("não libera a nota que voltou a ser apertada antes do tempo", async () => {
    vi.useFakeTimers();
    setSustain(true);
    await noteOn("B4");
    noteOff("B4");
    vi.advanceTimersByTime(1000);
    await noteOn("B4");
    calls.length = 0;

    vi.advanceTimersByTime(5000);
    expect(calls).toEqual([]);
  });
});
