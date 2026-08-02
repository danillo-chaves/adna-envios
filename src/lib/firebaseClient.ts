import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "envio-emails-notas",
  appId: "1:72779107967:web:5e65329ecfc2472a80b94a",
  storageBucket: "envio-emails-notas.firebasestorage.app",
  apiKey: "AIzaSyDcVELnp85O6OkED0ICz7zrcwWna4hkaWw",
  authDomain: "envio-emails-notas.firebaseapp.com",
  messagingSenderId: "72779107967"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
