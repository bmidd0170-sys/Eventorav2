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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

// Expose config in the browser for debugging and log it once
if (typeof window !== 'undefined') {
  try {
    if (missingFirebaseConfigKeys.length) {
      // eslint-disable-next-line no-console
      console.warn(
        'Missing Firebase config keys. Add NEXT_PUBLIC_FIREBASE_* values to .env, or configure GitHub Secrets/environment variables with the same names:',
        missingFirebaseConfigKeys,
      )
    }
    // eslint-disable-next-line no-console
    console.log('Firebase env vars:', {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
    ; (window as any).__FIREBASE_CONFIG = firebaseConfig
    // eslint-disable-next-line no-console
    console.info('Resolved Firebase config:', firebaseConfig)
  } catch (e) {
    // ignore
  }
}

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  } catch {
    return getAuth(app)
  }
})();
export const db = getFirestore(app);
export default app;
