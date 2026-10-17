import { useEffect, useRef } from "react";
import { firebaseConfigured } from "../utils/firebase";

const initialOf = (user) =>
  (user.displayName || user.email || "?").trim().charAt(0).toUpperCase();

// Botão de conta no topo: "Entrar" sem login; com login, a inicial abre um menu
// com a conta, "Sincronizar agora" e "Sair"
export default function AccountMenu({ account }) {
  const menuRef = useRef(null);
  const { user, ready, syncing } = account;

  // <details> não fecha sozinho ao clicar fora
  useEffect(() => {
    const closeOutside = (e) => {
      if (menuRef.current?.open && !menuRef.current.contains(e.target)) {
        menuRef.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  if (!firebaseConfigured || !ready) return null;

  if (!user) {
    return (
      <button type="button" className="btn btn-sm" onClick={account.signIn}>
        Entrar
      </button>
    );
  }

  const close = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <details className="account-menu" ref={menuRef}>
      <summary className="account-avatar" aria-label="Conta">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          initialOf(user)
        )}
      </summary>
      <div className="account-popover">
        <p className="muted account-email">{user.email || user.displayName || "Conta Google"}</p>
        <p className="muted">{syncing ? "Sincronizando…" : "Cifras sincronizadas com a conta."}</p>
        <button
          type="button"
          className="btn btn-sm"
          disabled={syncing}
          onClick={() => {
            close();
            account.syncNow();
          }}
        >
          Sincronizar agora
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            close();
            account.signOut();
          }}
        >
          Sair da conta
        </button>
      </div>
    </details>
  );
}
