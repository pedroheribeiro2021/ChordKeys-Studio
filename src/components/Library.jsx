import { useEffect, useRef, useState } from "react";
import {
  deleteSong,
  exportBackup,
  importBackup,
  listSongs,
} from "../utils/songStore";
import { firebaseConfigured, missingFirebaseConfig, syncDeletedSongs } from "../utils/firebase";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const describeSettings = (song) =>
  [
    song.transpose ? `Tom ${song.transpose > 0 ? "+" : ""}${song.transpose}` : null,
    song.capo ? `Capo ${song.capo}ª` : null,
    song.key ? `Tom da música ${song.key}${song.mode === "minor" ? " menor" : " maior"}` : null,
    song.simplify
      ? `Simplificada · ${
          { facil: "fácil", medio: "equilibrada", fiel: "fiel" }[song.difficulty] ?? "equilibrada"
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

export default function Library({ onOpen, account }) {
  const [songs, setSongs] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [persisted, setPersisted] = useState(null);
  const { user, ready: authReady, syncing, syncedAt } = account;
  const fileRef = useRef(null);

  const refresh = () =>
    listSongs()
      .then(setSongs)
      .catch(() => setMessage({ error: true, text: "Não foi possível ler as cifras salvas." }));

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  // Recarrega ao abrir e depois de cada sincronização da conta
  useEffect(() => {
    refresh();
  }, [syncedAt]);

  const handleDelete = async (id) => {
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    try {
      await deleteSong(id);
      await syncDeletedSongs();
      setMessage(null);
      setConfirmingId(null);
      await refresh();
    } catch (error) {
      setMessage({
        error: true,
        text: `Excluída neste aparelho, mas a sincronização falhou: ${error.message}`,
      });
      setConfirmingId(null);
      await refresh();
    }
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
      await refresh();
      let syncResult;
      try {
        syncResult = await syncDeletedSongs();
      } catch (error) {
        setMessage({
          error: true,
          text: `Backup importado neste aparelho, mas não sincronizado: ${error.message}`,
        });
        return;
      }
      setMessage({
        text: `Backup importado ${firebaseConfigured && user ? "e sincronizado" : "neste aparelho"}: ${added} nova(s), ${updated} atualizada(s)${skipped ? `, ${skipped} já estava(m) em dia` : ""}.${syncResult.uploaded ? ` ${syncResult.uploaded} enviada(s) à nuvem.` : ""}`,
      });
    } catch (error) {
      setMessage({
        error: true,
        text: error instanceof SyntaxError ? "Esse arquivo não é um backup válido." : error.message,
      });
    }
  };

  const backupActions = (
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
  );

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

      <section className="card" aria-labelledby="sync-title">
        <h2 className="card-title" id="sync-title">
          Sincronização
        </h2>
        {!firebaseConfigured ? (
          <p className="muted backup-text">
            Firebase não conectado: faltam {missingFirebaseConfig.join(", ")}. Configure essas
            variáveis no ambiente local ou de build e reinicie/republique o app. Depois, habilite
            Google Authentication, crie o Firestore e publique firestore.rules.
          </p>
        ) : user ? (
          <>
            <p className="muted backup-text">
              {syncing
                ? "Sincronizando suas cifras…"
                : `Conectado como ${user.email || user.displayName || "conta Google"}.`}
            </p>
            <button type="button" className="btn" onClick={account.signOut}>
              Sair da conta
            </button>
            <button
              type="button"
              className="btn"
              onClick={account.syncNow}
              disabled={syncing}
            >
              Sincronizar agora
            </button>
          </>
        ) : (
          <>
            <p className="muted backup-text">
              Entre com sua conta Google para manter suas cifras sincronizadas entre aparelhos.
              A cópia local continua disponível offline.
            </p>
            <button
              type="button"
              className="btn"
              onClick={account.signIn}
              disabled={!authReady || syncing}
            >
              Entrar com Google
            </button>
          </>
        )}
        {account.message && (
          <p className={account.message.error ? "error" : "muted"} role="status">
            {account.message.text}
          </p>
        )}
      </section>

      {/* Com conta, a sincronização cuida do dia a dia e o backup fica recolhido;
          sem conta, ele é a única cópia fora do aparelho */}
      <section className="card" aria-labelledby="backup-title">
        {user ? (
          <details className="backup-details">
            <summary className="card-title" id="backup-title">
              Exportar / importar cifras
            </summary>
            <p className="muted backup-text">
              Suas cifras já sincronizam com a sua conta. Exporte um arquivo para ter uma cópia
              de segurança: a sincronização também leva exclusões para todos os aparelhos.
            </p>
            {backupActions}
          </details>
        ) : (
          <>
            <h2 className="card-title" id="backup-title">
              Backup
            </h2>
            <p className="muted backup-text">
              As cifras ficam guardadas só neste aparelho. Exporte um backup para ter uma cópia
              independente, ou entre com sua conta Google para sincronizar.
              {persisted === false &&
                " No iPhone, instale o app na tela inicial (Compartilhar → Adicionar à Tela de Início) para o Safari não apagar as cifras."}
            </p>
            {backupActions}
          </>
        )}
        {message && (
          <p className={message.error ? "error" : "muted"} role="status">
            {message.text}
          </p>
        )}
      </section>
    </>
  );
}
