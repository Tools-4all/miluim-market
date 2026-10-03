// Context = דרך לשתף מידע עם כל הקומפוננטות בלי להעביר אותו ב-props מאחת לשנייה.
// כאן אנחנו משתפים: מי המשתמש המחובר, ופונקציות להתחבר ולהתנתק.
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // user = המשתמש המחובר, או null אם אף אחד לא מחובר
  const [user, setUser] = useState(null)
  // loading = true עד ש-Firebase בודק אם יש משתמש מחובר מהפעם הקודמת
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onAuthStateChanged - Firebase קורא לפונקציה הזו בכל פעם שמישהו מתחבר או מתנתק
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    // כשהקומפוננטה נעלמת - מפסיקים להאזין
    return unsubscribe
  }, [])

  async function login() {
    // פותח חלון של גוגל לבחירת חשבון
    const result = await signInWithPopup(auth, googleProvider)
    const u = result.user
    // שומרים את המשתמש באוסף users כדי שאחרים יוכלו לראות את השם שלו.
    // merge: true - לא מוחק שדות שכבר קיימים (כמו טלפון ועיר)
    await setDoc(
      doc(db, 'users', u.uid),
      { name: u.displayName, photo: u.photoURL },
      { merge: true },
    )
  }

  function logout() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// hook קטן שלנו - כל קומפוננטה כותבת useAuth() ומקבלת את המשתמש
export function useAuth() {
  return useContext(AuthContext)
}
