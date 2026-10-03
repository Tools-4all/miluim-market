// תגובות ושאלות על מודעה.
// התגובות נשמרות בתת-אוסף: listings/{id}/comments
import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

function Comments({ listingId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'listings', listingId, 'comments'), orderBy('createdAt'))
    // onSnapshot - בניגוד ל-getDocs, ממשיך להאזין.
    // כל פעם שמישהו מוסיף תגובה, הפונקציה רצה שוב והרשימה מתעדכנת לבד ("זמן אמת")
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    // כשעוזבים את העמוד - מפסיקים להאזין
    return unsubscribe
  }, [listingId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (text.trim() === '') return
    await addDoc(collection(db, 'listings', listingId, 'comments'), {
      text: text.trim(),
      authorId: user.uid,
      authorName: user.displayName,
      createdAt: serverTimestamp(),
    })
    setText('') // מנקים את השדה
  }

  function handleDelete(commentId) {
    deleteDoc(doc(db, 'listings', listingId, 'comments', commentId))
  }

  return (
    <section className="panel comments">
      <h2>שאלות ותגובות ({comments.length})</h2>

      {comments.length === 0 && <p className="card-meta">עוד אין שאלות. אפשר להיות הראשונים לשאול.</p>}

      {comments.map((c) => (
        <div key={c.id} className="comment">
          <div className="comment-header">
            <strong>{c.authorName}</strong>
            {user && user.uid === c.authorId && (
              <button className="link-button" onClick={() => handleDelete(c.id)}>
                מחיקה
              </button>
            )}
          </div>
          <p>{c.text}</p>
        </div>
      ))}

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="כתבו שאלה למוכר..." />
          <button type="submit">שליחה</button>
        </form>
      ) : (
        <p className="card-meta">צריך להתחבר כדי לשאול שאלה.</p>
      )}
    </section>
  )
}

export default Comments
