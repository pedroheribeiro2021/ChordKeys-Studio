import { mergeSyncRecords } from "./songStore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(Boolean);

let servicesPromise;

const stableRecord = (record) =>
  JSON.stringify(
    Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  );

const getServices = () => {
  if (!firebaseConfigured) {
    throw new Error("Configure o Firebase para ativar a sincronização.");
  }
  servicesPromise ??= Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]).then(([appSdk, authSdk, firestoreSdk]) => {
    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(config);
    return {
      authSdk,
      auth: authSdk.getAuth(app),
      database: firestoreSdk.getFirestore(app),
      firestoreSdk,
      googleProvider: new authSdk.GoogleAuthProvider(),
    };
  });
  return servicesPromise;
};

export function observeAuth(callback, onError = () => {}) {
  let cancelled = false;
  let unsubscribe;

  if (!firebaseConfigured) {
    queueMicrotask(() => callback(null));
    return () => {};
  }

  getServices()
    .then(({ auth, authSdk }) => {
      if (!cancelled) unsubscribe = authSdk.onAuthStateChanged(auth, callback, onError);
    })
    .catch(onError);

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export const signIn = async () => {
  const { auth, authSdk, googleProvider } = await getServices();

  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (mobile) {
    await authSdk.signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    await authSdk.signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      await authSdk.signInWithRedirect(auth, googleProvider);
      return;
    }
    throw error;
  }
};

export const signOutUser = async () => {
  if (!firebaseConfigured) return;
  const { auth, authSdk } = await getServices();
  await authSdk.signOut(auth);
};

export async function syncSongs(user) {
  if (!firebaseConfigured || !user) return { uploaded: 0, downloaded: 0 };

  const { database, firestoreSdk } = await getServices();
  const userSongs = firestoreSdk.collection(database, "users", user.uid, "songs");
  const remoteSnapshot = await firestoreSdk.getDocs(userSongs);
  const remoteRecords = remoteSnapshot.docs.map((snapshot) => snapshot.data());
  const { records, downloaded } = await mergeSyncRecords(remoteRecords);
  let uploaded = 0;

  for (const song of records) {
    const remote = remoteSnapshot.docs.find((snapshot) => snapshot.id === song.id)?.data();
    if (
      remote &&
      (remote.updatedAt ?? "") > (song.updatedAt ?? "") ||
      (remote && remote.updatedAt === song.updatedAt && stableRecord(remote) === stableRecord(song))
    ) {
      continue;
    }
    await firestoreSdk.setDoc(
      firestoreSdk.doc(database, "users", user.uid, "songs", song.id),
      song,
    );
    uploaded++;
  }

  return { uploaded, downloaded };
}

export async function syncSong(song) {
  if (!firebaseConfigured) return false;
  const { auth, database, firestoreSdk } = await getServices();
  if (!auth.currentUser) return false;
  await firestoreSdk.setDoc(
    firestoreSdk.doc(database, "users", auth.currentUser.uid, "songs", song.id),
    song,
  );
  return true;
}

export async function syncDeletedSongs() {
  if (!firebaseConfigured) return { uploaded: 0, downloaded: 0 };
  const { auth } = await getServices();
  return syncSongs(auth.currentUser);
}
