// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY2howFu7SA18diSz8elAjAom2JoGLjk4",
  authDomain: "citas-75c4a.firebaseapp.com",
  projectId: "citas-75c4a",
  storageBucket: "citas-75c4a.firebasestorage.app",
  messagingSenderId: "155588241043",
  appId: "1:155588241043:web:7149ccde21f2b9f73d4f66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };