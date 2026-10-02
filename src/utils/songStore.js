// Cifras salvas no aparelho (IndexedDB). Sem servidor e sem login: o backup em JSON
// é o jeito de levar as cifras para outro aparelho. Ver docs/ADR/0001.

const DB_NAME = "chordkeys";
const STORE = "songs";
const BACKUP_FORMAT = "chordkeys-backup";

let dbPromise = null;

const promisify = (request) =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const openDb = () => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE, { keyPath: "id" });
  };
  return promisify(request);
};

const withStore = async (mode, fn) => {
  dbPromise ??= openDb();
  const db = await dbPromise;
  const tx = db.transaction(STORE, mode);
  const result = await promisify(fn(tx.objectStore(STORE)));
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return result;
};

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// song: { id?, title, artist, text, transpose, capo, simplify, sourceUrl }
export async function saveSong(song) {
  const now = new Date().toISOString();
  const existing = song.id ? await getSong(song.id) : null;

  const record = {
    transpose: 0,
    capo: 0,
    simplify: false,
    artist: "",
    sourceUrl: "",
    ...existing,
    ...song,
    id: song.id ?? newId(),
    title: (song.title ?? existing?.title)?.trim() || "Sem título",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await withStore("readwrite", (store) => store.put(record));
  return record;
}

export const getSong = (id) => withStore("readonly", (store) => store.get(id)).then((s) => s ?? null);

export const deleteSong = (id) => withStore("readwrite", (store) => store.delete(id));

export async function listSongs() {
  const songs = await withStore("readonly", (store) => store.getAll());
  return songs.sort((a, b) => a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }));
}

export async function exportBackup() {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: await withStore("readonly", (store) => store.getAll()),
  };
}

// Junta o backup com o que já existe: a versão editada por último vence
export async function importBackup(backup) {
  if (backup?.format !== BACKUP_FORMAT || !Array.isArray(backup.songs)) {
    throw new Error("Esse arquivo não é um backup do ChordKeys.");
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const song of backup.songs) {
    if (!song?.id || typeof song.text !== "string") {
      skipped++;
      continue;
    }

    const existing = await getSong(song.id);
    if (existing && existing.updatedAt >= song.updatedAt) {
      skipped++;
      continue;
    }

    await withStore("readwrite", (store) => store.put(song));
    if (existing) updated++;
    else added++;
  }

  return { added, updated, skipped };
}

// Pede ao navegador para não apagar os dados quando faltar espaço.
// Retorna true se o armazenamento ficou persistente.
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}
