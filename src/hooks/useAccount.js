import { useEffect, useState } from "react";
import { observeAuth, signIn, signOutUser, syncSongs } from "../utils/firebase";

// Conta Google e sincronização, compartilhadas por todas as telas: o login acontece
// no topo do app e a sincronização roda mesmo fora de "Minhas cifras".
// `syncedAt` muda a cada sincronização para quem lista as cifras recarregar.
export function useAccount() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedAt, setSyncedAt] = useState(0);
  const [message, setMessage] = useState(null);

  const runSync = async (account, describe) => {
    setSyncing(true);
    try {
      const result = await syncSongs(account);
      setSyncedAt(Date.now());
      const text = describe(result);
      if (text) setMessage({ text });
    } catch (error) {
      setMessage({ error: true, text: `Falha na sincronização: ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(
    () =>
      observeAuth(
        (nextUser) => {
          setUser(nextUser);
          setReady(true);
          if (!nextUser) return;
          runSync(nextUser, ({ uploaded, downloaded }) =>
            uploaded || downloaded
              ? `Sincronizado: ${downloaded} baixada(s), ${uploaded} enviada(s).`
              : null,
          );
        },
        (error) => {
          setReady(true);
          setMessage({ error: true, text: `Falha ao iniciar Firebase: ${error.message}` });
        },
      ),
    [],
  );

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

  const syncNow = () => {
    if (!user) return;
    return runSync(
      user,
      ({ uploaded, downloaded }) =>
        `Sincronização concluída: ${downloaded} baixada(s), ${uploaded} enviada(s).`,
    );
  };

  return {
    user,
    ready,
    syncing,
    syncedAt,
    message,
    clearMessage: () => setMessage(null),
    signIn: handleSignIn,
    signOut: handleSignOut,
    syncNow,
  };
}
