// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA6vVdAuNGm9CqE1aEqosn-HW3MsHx0SQ0",
    authDomain: "gamified-learning-tool-77432.firebaseapp.com",
    projectId: "gamified-learning-tool-77432",
    storageBucket: "gamified-learning-tool-77432.firebasestorage.app",
    messagingSenderId: "120471830205",
    appId: "1:120471830205:web:c71340d4a6c8ef485d41d4",
    measurementId: "G-QC8T4V5Y21"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };