// הקובץ הזה מחבר את האפליקציה ל-Firebase.
// כל קובץ אחר שצריך את מסד הנתונים או את ההתחברות - מייבא מכאן.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// הפרטים של הפרויקט שלנו ב-Firebase.
// הם נשמרים בקובץ .env.local, ו-Vite מכניס אותם לכאן דרך import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// auth - אחראי על התחברות משתמשים
export const auth = getAuth(app)
// googleProvider - אומר ל-Firebase שאנחנו מתחברים עם חשבון גוגל
export const googleProvider = new GoogleAuthProvider()
// db - מסד הנתונים (Firestore)
export const db = getFirestore(app)
