import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4csD4jOobDJx1UvmELjVn9tgRBUyNdoI",
  authDomain: "golvision-bdd.firebaseapp.com",
  databaseURL: "https://golvision-bdd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "golvision-bdd",
  storageBucket: "golvision-bdd.appspot.com",
  messagingSenderId: "464679352252",
  appId: "AQUÍ_TU_APP_ID" // 🔴 Copia el App ID correcto aquí
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
