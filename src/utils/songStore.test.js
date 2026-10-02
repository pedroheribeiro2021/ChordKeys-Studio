import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteSong,
  exportBackup,
  getSong,
  importBackup,
  listSongs,
  saveSong,
} from "./songStore";

beforeEach(async () => {
  for (const song of await listSongs()) await deleteSong(song.id);
});

describe("songStore", () => {
  it("salva com padrões e lê de volta", async () => {
    const saved = await saveSong({ title: "  Tempo Perdido ", text: "C G" });

    expect(saved).toMatchObject({ title: "Tempo Perdido", transpose: 0, capo: 0, simplify: false });
    expect(saved.id).toBeTruthy();
    expect(await getSong(saved.id)).toEqual(saved);
  });

  it("atualiza mantendo a data de criação", async () => {
    const first = await saveSong({ title: "A", text: "C" });
    await new Promise((r) => setTimeout(r, 5));
    const second = await saveSong({ id: first.id, capo: 2 });

    expect(second).toMatchObject({ title: "A", text: "C", capo: 2, createdAt: first.createdAt });
    expect(second.updatedAt > first.updatedAt).toBe(true);
  });

  it("lista em ordem alfabética ignorando acento e caixa", async () => {
    await saveSong({ title: "Zé", text: "" });
    await saveSong({ title: "água", text: "" });
    await saveSong({ title: "Bola", text: "" });

    expect((await listSongs()).map((s) => s.title)).toEqual(["água", "Bola", "Zé"]);
  });

  it("título vazio vira 'Sem título'", async () => {
    expect((await saveSong({ title: " ", text: "C" })).title).toBe("Sem título");
  });

  it("exclui", async () => {
    const song = await saveSong({ title: "X", text: "C" });
    await deleteSong(song.id);
    expect(await getSong(song.id)).toBeNull();
  });
});

describe("backup", () => {
  it("exporta e importa num aparelho vazio", async () => {
    await saveSong({ title: "A", text: "C" });
    await saveSong({ title: "B", text: "G" });
    const backup = JSON.parse(JSON.stringify(await exportBackup()));

    for (const song of await listSongs()) await deleteSong(song.id);

    expect(await importBackup(backup)).toEqual({ added: 2, updated: 0, skipped: 0 });
    expect((await listSongs()).map((s) => s.title)).toEqual(["A", "B"]);
  });

  it("a versão editada por último vence", async () => {
    const song = await saveSong({ title: "Local", text: "C" });
    const older = { ...song, title: "Antiga", updatedAt: "2000-01-01T00:00:00.000Z" };
    const newer = { ...song, title: "Nova", updatedAt: "2999-01-01T00:00:00.000Z" };

    expect(await importBackup({ format: "chordkeys-backup", songs: [older] })).toMatchObject({ skipped: 1 });
    expect((await getSong(song.id)).title).toBe("Local");

    expect(await importBackup({ format: "chordkeys-backup", songs: [newer] })).toMatchObject({ updated: 1 });
    expect((await getSong(song.id)).title).toBe("Nova");
  });

  it("recusa arquivo que não é backup", async () => {
    await expect(importBackup({ foo: 1 })).rejects.toThrow("não é um backup");
  });

  it("pula itens inválidos", async () => {
    const result = await importBackup({ format: "chordkeys-backup", songs: [{ id: "x" }, null] });
    expect(result).toEqual({ added: 0, updated: 0, skipped: 2 });
  });
});
