import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4csD4jOobDJx1UvmELjVn9tgRBUyNdoI",
  authDomain: "golvision-bdd.firebaseapp.com",
  databaseURL: "https://golvision-bdd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "golvision-bdd",
  storageBucket: "golvision-bdd.appspot.com",
  messagingSenderId: "464679352252",
  appId: "1:464679352252:web:ef35d1bda566cc47d8ddb9",
  measurementId: "G-QEB4K8XKK7"
};

// Inicializar Firebaseeeeee
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// 🔴 Verificar que el archivo se está cargando correctamente
console.log("Firebase configurado correctamente.");
