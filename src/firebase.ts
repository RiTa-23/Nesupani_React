import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ここにFirebaseコンソールで取得した設定を記載
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "nesugoshipanic.firebaseapp.com",
  projectId: "nesugoshipanic",
  storageBucket: "nesugoshipanic.firebasestorage.app",
  messagingSenderId: "122002042444",
  appId: "1:122002042444:web:28968c35f4886b37638ee9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);