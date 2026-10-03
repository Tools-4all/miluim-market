// רשימת כל השיחות שלי - גם כקונה וגם כמוכר
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

function Chats() {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      // array-contains - מביא את השיחות שבהן המשתמש נמצא במערך participants
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
      const snapshot = await getDocs(q)
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => c.lastMessage) // שיחה שעוד לא נשלחה בה הודעה לא מוצגת
      // מיון: השיחה עם ההודעה האחרונה ביותר למעלה
      items.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
      setChats(items)
      setLoading(false)
    }
    load()
  }, [user])

  if (!user) return <p className="empty">צריך להתחבר כדי לראות הודעות.</p>
  if (loading) return <p className="loading">טוען...</p>

  return (
    <div className="narrow">
      <div className="page-header">
        <h1>הודעות</h1>
        <p>שיחות עם קונים ומוכרים.</p>
      </div>

      {chats.length === 0 && (
        <p className="empty">עוד אין שיחות. כדי לפנות למוכר, היכנסו למודעה ולחצו "שליחת הודעה למוכר".</p>
      )}

      <div className="chat-list">
        {chats.map((c) => {
          const iAmSeller = user.uid === c.sellerId
          const isUnread = c.unreadBy === user.uid
          return (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className={isUnread ? 'panel chat-list-item chat-unread' : 'panel chat-list-item'}
            >
              <div className="chat-list-top">
                <strong>{iAmSeller ? c.buyerName : c.sellerName}</strong>
                <span className="pill">
                  {isUnread ? 'הודעה חדשה' : iAmSeller ? 'מתעניין במודעה שלך' : 'מוכר'}
                </span>
              </div>
              <span className="card-meta">{c.listingTitle}</span>
              <p className="chat-list-last">
                {c.lastSenderId === user.uid && 'אני: '}
                {c.lastMessage}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default Chats
