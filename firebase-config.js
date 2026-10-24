import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMqYM4N45QEQ8rhuClYWJlN7--hziQDgw",
  authDomain: "pixal-pioneers.firebaseapp.com",
  projectId: "pixal-pioneers",
  storageBucket: "pixal-pioneers.firebasestorage.app",
  messagingSenderId: "40873488471",
  appId: "1:40873488471:web:eb81426b96134f926e7312",
  measurementId: "G-4F74L954L4"
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const app = initializeApp(firebaseConfig);

// Auto-detect long polling: fixes "client is offline" / random connection
// failures on networks or browsers that block Firestore's default WebChannel stream.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});