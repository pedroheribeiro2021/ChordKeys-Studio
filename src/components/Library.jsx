import { useEffect, useRef, useState } from "react";
import {
  deleteSong,
  exportBackup,
  importBackup,
  listSongs,
} from "../utils/songStore";
import {
  firebaseConfigured,
  observeAuth,
  signIn,
  signOutUser,
  syncDeletedSongs,
  syncSongs,
} from "../utils/firebase";

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

export default function Library({ onOpen }) {
  const [songs, setSongs] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [persisted, setPersisted] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef(null);

  const refresh = () =>
    listSongs()
      .then(setSongs)
      .catch(() => setMessage({ error: true, text: "Não foi possível ler as cifras salvas." }));

  useEffect(() => {
    refresh();
    navigator.storage?.persisted?.().then(setPersisted);
    return observeAuth(
      async (nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
        if (!nextUser) return;

        setSyncing(true);
        try {
          const result = await syncSongs(nextUser);
          await refresh();
          if (result.uploaded || result.downloaded) {
            setMessage({
              text: `Sincronizado: ${result.downloaded} baixada(s), ${result.uploaded} enviada(s).`,
            });
          }
        } catch (error) {
          setMessage({ error: true, text: `Falha na sincronização: ${error.message}` });
        } finally {
          setSyncing(false);
        }
      },
      (error) => {
        setAuthReady(true);
        setMessage({ error: true, text: `Falha ao iniciar Firebase: ${error.message}` });
      },
    );
  }, []);

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

  const handleSignIn = async () => {
    setMessage(null);
    try {
      await signIn();
    } catch (error) {
      setMessage({ error: true, text: `Não foi possível entrar: ${error.message}` });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setMessage({ text: "Sessão encerrada. As cifras locais foram mantidas." });
    } catch (error) {
      setMessage({ error: true, text: `Não foi possível sair: ${error.message}` });
    }
  };

  const handleSyncNow = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const result = await syncSongs(user);
      await refresh();
      setMessage({
        text: `Sincronização concluída: ${result.downloaded} baixada(s), ${result.uploaded} enviada(s).`,
      });
    } catch (error) {
      setMessage({ error: true, text: `Falha na sincronização: ${error.message}` });
    } finally {
      setSyncing(false);
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
        text: `Backup importado: ${added} nova(s), ${updated} atualizada(s)${skipped ? `, ${skipped} já estava(m) em dia` : ""}.${syncResult.uploaded ? ` ${syncResult.uploaded} enviada(s) à nuvem.` : ""}`,
      });
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

      <section className="card" aria-labelledby="sync-title">
        <h2 className="card-title" id="sync-title">
          Sincronização
        </h2>
        {!firebaseConfigured ? (
          <p className="muted backup-text">
            Firebase ainda não está configurado. Adicione as variáveis VITE_FIREBASE_* do
            arquivo .env.example e publique as regras de firestore.rules para sincronizar
            suas cifras entre aparelhos.
          </p>
        ) : user ? (
          <>
            <p className="muted backup-text">
              {syncing
                ? "Sincronizando suas cifras…"
                : `Conectado como ${user.email || user.displayName || "conta Google"}.`}
            </p>
            <button type="button" className="btn" onClick={handleSignOut}>
              Sair da conta
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleSyncNow}
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
              onClick={handleSignIn}
              disabled={!authReady || syncing}
            >
              Entrar com Google
            </button>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="backup-title">
        <h2 className="card-title" id="backup-title">
          Backup
        </h2>
        <p className="muted backup-text">
          As cifras ficam guardadas neste aparelho e, quando conectado, na sua conta Firebase.
          Exporte um backup para ter uma cópia independente.
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
