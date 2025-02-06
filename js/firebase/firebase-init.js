import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVCDTt-3j__qivjidYU-1qf7aYULZV2Fk",
  authDomain: "learn-hanja.firebaseapp.com",
  projectId: "learn-hanja",
  storageBucket: "learn-hanja.firebasestorage.app",
  messagingSenderId: "279357621826",
  appId: "1:279357621826:web:551c24d33361a089c20fdb",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
