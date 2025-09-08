import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBekrSR1DOa1wI0C1BTLpvfP-pOSMRj8po",
  authDomain: "shw-order-portal.firebaseapp.com",
  projectId: "shw-order-portal",
  storageBucket: "shw-order-portal.appspot.com",
  messagingSenderId: "515551301417",
  appId: "1:515551301417:web:8cdfd1a088f37e3e78c6e0"
};

// Initialize Firebase only if it hasn't been initialized
let app;
let db;
let auth;
let storage;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore with offline persistence disabled to avoid connection issues
    db = initializeFirestore(app, {
      cache: memoryLocalCache()
    });
    
    auth = getAuth(app);
    storage = getStorage(app);
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // Fallback initialization
  app = getApps()[0] || initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

export { db, auth, storage };
export default app;