import { useEffect, useRef, useState } from "react";
import {
  deleteSong,
  exportBackup,
  importBackup,
  listSongs,
} from "../utils/songStore";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const describeSettings = (song) =>
  [
    song.transpose ? `Tom ${song.transpose > 0 ? "+" : ""}${song.transpose}` : null,
    song.capo ? `Capo ${song.capo}ª` : null,
    song.simplify ? "Simplificada" : null,
  ]
    .filter(Boolean)
    .join(" · ");

export default function Library({ onOpen }) {
  const [songs, setSongs] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [persisted, setPersisted] = useState(null);
  const fileRef = useRef(null);

  const refresh = () =>
    listSongs()
      .then(setSongs)
      .catch(() => setMessage({ error: true, text: "Não foi possível ler as cifras salvas." }));

  useEffect(() => {
    refresh();
    navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const handleDelete = async (id) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    await deleteSong(id);
    setConfirmingId(null);
    refresh();
  };

  const handleExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `chordkeys-backup-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage({ text: `Backup com ${backup.songs.length} cifra(s) baixado.` });
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const { added, updated, skipped } = await importBackup(JSON.parse(await file.text()));
      setMessage({
        text: `Backup importado: ${added} nova(s), ${updated} atualizada(s)${skipped ? `, ${skipped} já estava(m) em dia` : ""}.`,
      });
      refresh();
    } catch (error) {
      setMessage({
        error: true,
        text: error instanceof SyntaxError ? "Esse arquivo não é um backup válido." : error.message,
      });
    }
  };

  return (
    <>
      <section className="card" aria-labelledby="library-title">
        <div className="card-header">
          <h2 className="card-title" id="library-title">
            Minhas cifras
          </h2>
          {songs && <span className="muted">{songs.length}</span>}
        </div>

        {songs === null && <p className="muted">Carregando…</p>}

        {songs?.length === 0 && (
          <p className="muted">
            Nenhuma cifra salva ainda. Abra uma cifra e toque em “Salvar cifra”.
          </p>
        )}

        {songs?.length > 0 && (
          <ul className="song-list">
            {songs.map((song) => (
              <li key={song.id} className="song-item">
                <button type="button" className="song-open" onClick={() => onOpen(song)}>
                  <span className="song-item-title">{song.title}</span>
                  <span className="muted">
                    {[song.artist, describeSettings(song)].filter(Boolean).join(" — ") ||
                      formatDate(song.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${confirmingId === song.id ? "btn-danger" : "btn-ghost"}`}
                  onClick={() => handleDelete(song.id)}
                  onBlur={() => setConfirmingId(null)}
                  aria-label={confirmingId === song.id ? `Confirmar exclusão de ${song.title}` : `Excluir ${song.title}`}
                >
                  {confirmingId === song.id ? "Excluir?" : "Excluir"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="backup-title">
        <h2 className="card-title" id="backup-title">
          Backup
        </h2>
        <p className="muted backup-text">
          As cifras ficam guardadas só neste aparelho. Exporte um backup para levar a outro
          aparelho ou para não perder se os dados do navegador forem apagados.
          {persisted === false &&
            " No iPhone, instale o app na tela inicial (Compartilhar → Adicionar à Tela de Início) para o Safari não apagar as cifras."}
        </p>
        <div className="row">
          <button type="button" className="btn" onClick={handleExport} disabled={!songs?.length}>
            Exportar backup
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Importar backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
        </div>
        {message && (
          <p className={message.error ? "error" : "muted"} role="status">
            {message.text}
          </p>
        )}
      </section>
    </>
  );
}
