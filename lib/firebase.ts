import { initializeApp, getApps, getApp } from 'firebase/app';
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function cleanEnv(value: string | undefined) {
  // Trim whitespace and strip any surrounding single or double quotes
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Expose config in the browser for debugging and log it once
if (typeof window !== 'undefined') {
  try {
    ; (window as any).__FIREBASE_CONFIG = firebaseConfig
    // eslint-disable-next-line no-console
    console.info('Resolved Firebase config:', firebaseConfig)
  } catch (e) {
    // ignore
  }
}

export const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  });
export const db = getFirestore(app);
export default app;
