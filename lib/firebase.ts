import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBekrSR1DOa1wI0C1BTLpvfP-pOSMRj8po").trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "shw-order-portal.firebaseapp.com").trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shw-order-portal").trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "shw-order-portal.appspot.com").trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "515551301417").trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:515551301417:web:8cdfd1a088f37e3e78c6e0").trim()
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;