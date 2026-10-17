import { useEffect, useRef, useState } from "react";
import { firebaseConfigured } from "../utils/firebase";

const SEEN_KEY = "chordkeys:welcome-seen";

const readSeen = () => {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Sem armazenamento (aba anônima): a tela volta na próxima abertura
  }
};

// Tela de boas-vindas da primeira abertura: entrar com Google ou seguir sem conta.
// O login é opcional; quem pular pode entrar depois pelo botão do topo.
export default function Welcome({ account }) {
  const dialogRef = useRef(null);
  const [seen, setSeen] = useState(readSeen);
  const show = firebaseConfigured && account.ready && !account.user && !seen;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (show && dialog && !dialog.open) dialog.showModal();
  }, [show]);

  if (!show) return null;

  const dismiss = () => {
    markSeen();
    setSeen(true);
  };

  return (
    // Esc também fecha: conta como "continuar sem conta"
    <dialog ref={dialogRef} className="welcome" aria-labelledby="welcome-title" onClose={dismiss}>
      <h2 id="welcome-title">Bem-vindo ao ChordKeys Studio</h2>
      <p className="muted">
        Entre com sua conta Google para guardar suas cifras na nuvem e abrir em qualquer aparelho.
        Sem conta, elas ficam salvas só neste aparelho.
      </p>
      <div className="welcome-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            dismiss();
            account.signIn();
          }}
        >
          Entrar com Google
        </button>
        <button type="button" className="btn btn-ghost" onClick={dismiss}>
          Continuar sem conta
        </button>
      </div>
    </dialog>
  );
}
