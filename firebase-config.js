import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfATnbfVHDhMjyMH9tAtnI-ZYRaV_i5y0",
  authDomain: "tute-6dd02.firebaseapp.com",
  projectId: "tute-6dd02",
  storageBucket: "tute-6dd02.firebasestorage.app",
  messagingSenderId: "306991294353",
  appId: "1:306991294353:web:03ee50d0ef2e605332dc30",
  measurementId: "G-WDW9QWQLCT",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
const storage = getStorage(app);
storage.maxUploadRetryTime = 4000;
storage.maxOperationRetryTime = 4000;

let analytics = null;
isSupported()
  .then((yes) => {
    if (yes) analytics = getAnalytics(app);
  })
  .catch(() => {});

// Set to true after enabling Firebase Storage + CORS in Firebase Console
const USE_FIREBASE_STORAGE = false;

export { app, auth, db, storage, analytics, USE_FIREBASE_STORAGE };
