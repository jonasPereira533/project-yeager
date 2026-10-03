import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Analytics foi removido de propósito: getAnalytics() roda no load do módulo e
// lançava INVALID_MEASUREMENT_ID sem VITE_FIREBASE_MEASUREMENT_ID, derrubando
// o app inteiro por uma feature que ninguém consumia. Se for preciso, inicialize
// sob demanda e dentro de um try/catch.
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { app, db }
