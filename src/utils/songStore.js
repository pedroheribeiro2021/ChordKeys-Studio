// IndexedDB is the offline copy; Firebase sync is layered on top of this store.

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

const nextUpdatedAt = (previous) => {
  const now = Date.now();
  const previousTime = Date.parse(previous ?? "");
  return new Date(Number.isFinite(previousTime) && previousTime >= now ? previousTime + 1 : now).toISOString();
};

// song: { id?, title, artist, text, transpose, capo, simplify, difficulty, key, mode }
export async function saveSong(song) {
  const existing = song.id ? await getStoredSong(song.id) : null;
  const now = new Date().toISOString();

  const record = {
    transpose: 0,
    capo: 0,
    simplify: false,
    difficulty: "medio",
    key: "",
    mode: "major",
    artist: "",
    ...existing,
    ...song,
    id: song.id ?? newId(),
    deletedAt: null,
    title: (song.title ?? existing?.title)?.trim() || "Sem título",
    createdAt: existing?.createdAt ?? now,
    updatedAt: nextUpdatedAt(existing?.updatedAt),
  };

  await withStore("readwrite", (store) => store.put(record));
  return record;
}

const getStoredSong = (id) =>
  withStore("readonly", (store) => store.get(id)).then((song) => song ?? null);

export const getSong = async (id) => {
  const song = await getStoredSong(id);
  return song?.deletedAt ? null : song;
};

export async function deleteSong(id) {
  const existing = await getStoredSong(id);
  if (!existing || existing.deletedAt) return;
  const now = new Date().toISOString();
  await withStore("readwrite", (store) =>
    store.put({ ...existing, text: "", deletedAt: now, updatedAt: nextUpdatedAt(existing.updatedAt) }),
  );
}

export async function listSongs() {
  const songs = await listSyncRecords();
  return songs
    .filter((song) => !song.deletedAt)
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }));
}

export const listSyncRecords = () =>
  withStore("readonly", (store) => store.getAll());

const stableRecord = (record) =>
  JSON.stringify(
    Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  );

export async function mergeSyncRecords(records) {
  const localSongs = await listSyncRecords();
  const localById = new Map(localSongs.map((song) => [song.id, song]));
  let downloaded = 0;

  for (const song of records) {
    if (!song?.id || typeof song.text !== "string") continue;
    const existing = localById.get(song.id);
    const localTime = existing?.updatedAt ?? "";
    const remoteTime = song.updatedAt ?? "";
    if (
      existing &&
      (localTime > remoteTime ||
        (localTime === remoteTime &&
          ((Boolean(existing.deletedAt) && !song.deletedAt) ||
            (Boolean(existing.deletedAt) === Boolean(song.deletedAt) &&
              stableRecord(existing) >= stableRecord(song)))))
    ) {
      continue;
    }
    await withStore("readwrite", (store) => store.put(song));
    localById.set(song.id, song);
    downloaded++;
  }

  return { records: [...localById.values()], downloaded };
}

/*
 * Backups intentionally contain only live songs. Tombstones stay local/cloud
 * so a deletion on one device cannot resurrect the song on another.
 */
export async function exportBackup() {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: await listSongs(),
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

    const existing = await getStoredSong(song.id);
    if (existing && !existing.deletedAt && existing.updatedAt >= song.updatedAt) {
      skipped++;
      continue;
    }

    const restored = {
      ...song,
      deletedAt: null,
      ...(existing?.deletedAt ? { updatedAt: nextUpdatedAt(existing.updatedAt) } : {}),
    };
    await withStore("readwrite", (store) =>
      store.put(restored),
    );
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
