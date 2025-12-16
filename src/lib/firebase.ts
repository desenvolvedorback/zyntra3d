import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXcXl-yOuaSvg24vnFkw7ztFEK-YqNdFI",
  authDomain: "doce-sabor-2f261.firebaseapp.com",
  projectId: "doce-sabor-2f261",
  storageBucket: "doce-sabor-2f261.appspot.com",
  messagingSenderId: "91616889474",
  appId: "1:91616889474:web:fb57f86b4de36eb159829b",
  measurementId: "G-NV30YBJE2J"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
