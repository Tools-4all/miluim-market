// שיחה פרטית בין קונה למוכר על מודעה אחת.
// השיחה נשמרת ב-chats/{chatId}, וההודעות בתת-אוסף chats/{chatId}/messages
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

function Chat() {
  const { chatId } = useParams()
  const { user } = useAuth()

  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)

  // useRef - "מצביע" לאלמנט על המסך. משתמשים בו כדי לגלול לסוף השיחה
  const bottomRef = useRef(null)

  // מאזינים למסמך השיחה (מי הקונה, מי המוכר, על איזו מודעה, ומי עוד לא קרא)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'chats', chatId),
      (snap) => {
        setChat(snap.exists() ? snap.data() : null)
        setLoading(false)
      },
      // כללי האבטחה חוסמים מי שלא משתתף בשיחה - אז פשוט לא מציגים אותה
      () => setLoading(false),
    )
    return unsubscribe
  }, [chatId])

  // אם יש בשיחה הודעה שאני עוד לא קראתי - עכשיו קראתי אותה, אז מסמנים כנקרא
  useEffect(() => {
    if (chat && user && chat.unreadBy === user.uid) {
      updateDoc(doc(db, 'chats', chatId), { unreadBy: null })
    }
  }, [chat, user, chatId])

  // מאזינים להודעות בזמן אמת - הודעה חדשה מהצד השני מופיעה מיד
  const chatExists = Boolean(chat)
  useEffect(() => {
    if (!chatExists) return
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsubscribe
  }, [chatExists, chatId])

  // בכל פעם שמגיעה הודעה - גוללים לתחתית
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (text.trim() === '') return
    const messageText = text.trim()
    setText('')

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: messageText,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    })
    // מעדכנים גם את מסמך השיחה: ההודעה האחרונה (לרשימת השיחות),
    // ו-unreadBy - הצד השני, שעוד לא קרא את ההודעה (בשביל המונה בתפריט)
    const otherId = user.uid === chat.sellerId ? chat.buyerId : chat.sellerId
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: messageText,
      lastSenderId: user.uid,
      updatedAt: serverTimestamp(),
      unreadBy: otherId,
    })
  }

  if (!user) return <p className="empty">צריך להתחבר כדי לראות הודעות.</p>
  if (loading) return <p className="loading">טוען...</p>
  if (!chat) return <p className="empty">השיחה לא נמצאה.</p>

  // מי הצד השני בשיחה?
  const iAmSeller = user.uid === chat.sellerId
  const otherName = iAmSeller ? chat.buyerName : chat.sellerName

  return (
    <div className="narrow">
      <Link to="/chats" className="back-link">
        → לכל ההודעות
      </Link>

      <div className="panel chat">
        <div className="chat-header">
          <strong>{otherName}</strong>
          <Link to={`/listing/${chat.listingId}`} className="card-meta">
            בנוגע ל: {chat.listingTitle}
          </Link>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="card-meta chat-empty">
              {iAmSeller ? 'עוד אין הודעות.' : 'כתבו למוכר שאתם מתעניינים, ושאלו כל מה שצריך.'}
            </p>
          )}

          {messages.map((m) => (
            // הודעות שלי והודעות של הצד השני מקבלות עיצוב שונה
            <div key={m.id} className={m.senderId === user.uid ? 'bubble bubble-mine' : 'bubble'}>
              <p>{m.text}</p>
              {m.createdAt && (
                <span className="bubble-time">
                  {m.createdAt.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="chat-form">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="כתבו הודעה..." />
          <button type="submit">שליחה</button>
        </form>
      </div>
    </div>
  )
}

export default Chat
