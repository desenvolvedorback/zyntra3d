import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAR9Ec9t6L2q9nfoqhBaEzWse2IU46DvKo",
  authDomain: "mercadopago-3d.firebaseapp.com",
  projectId: "mercadopago-3d",
  storageBucket: "mercadopago-3d.firebasestorage.app",
  messagingSenderId: "859364791724",
  appId: "1:859364791724:web:c6f1920adf098ee72ed609",
  measurementId: "G-75BK8KMR76"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
