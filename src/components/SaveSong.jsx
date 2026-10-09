import { useEffect, useState } from "react";

// Cifra nova: abre título/artista antes de salvar. Já salva: grava as alterações direto.
export default function SaveSong({ meta, disabled, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("Não foi possível salvar.");

  useEffect(() => {
    if (status !== "saved" && status !== "local-only") return;
    const timer = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const save = async (fields) => {
    setStatus("saving");
    try {
      const result = await onSave(fields);
      setEditing(false);
      setStatus(result?.synced === false ? "local-only" : "saved");
    } catch (error) {
      setErrorMessage(error.message || "Não foi possível salvar.");
      setStatus("error");
    }
  };

  const handleClick = () => {
    if (meta.id) {
      save({});
      return;
    }
    setTitle(meta.title ?? "");
    setArtist(meta.artist ?? "");
    setEditing(true);
  };

  if (editing) {
    return (
      <form
        className="save-form"
        onSubmit={(e) => {
          e.preventDefault();
          save({ title, artist });
        }}
      >
        <input
          className="input"
          placeholder="Nome da música"
          aria-label="Nome da música"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <input
          className="input"
          placeholder="Artista (opcional)"
          aria-label="Artista"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
        <div className="row">
          <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
            Salvar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="row">
      <button
        type="button"
        className="btn btn-sm"
        onClick={handleClick}
        disabled={disabled || status === "saving"}
      >
        {meta.id ? "Salvar alterações" : "Salvar cifra"}
      </button>
      {status === "saved" && <span className="muted" role="status">Salvo ✓</span>}
      {status === "local-only" && (
        <span className="muted" role="status">
          Salvo neste aparelho · conecte o Firebase em Minhas cifras
        </span>
      )}
      {status === "error" && <span className="error" role="alert">{errorMessage}</span>}
    </div>
  );
}
