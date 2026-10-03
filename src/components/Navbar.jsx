// סרגל הניווט העליון - מופיע בכל העמודים
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

function Navbar() {
  const { user, login, logout } = useAuth()
  // כמה שיחות יש בהן הודעה שעוד לא קראתי
  const [unreadCount, setUnreadCount] = useState(0)

  // מאזינים לכל השיחות שלי. כשמגיעה הודעה חדשה, המונה מתעדכן לבד
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unread = snapshot.docs.filter((d) => d.data().unreadBy === user.uid)
      setUnreadCount(unread.length)
    })
    return unsubscribe
  }, [user])

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">מ</span>
          <span>
            <span className="logo-name">מילואימרקט</span>
            <span className="logo-tagline">ציוד יד שנייה למילואימניקים</span>
          </span>
        </Link>

        {/* NavLink - כמו Link, אבל מוסיף את המחלקה active לקישור של העמוד הנוכחי */}
        <nav className="nav-links">
          <NavLink to="/" end>
            כל המודעות
          </NavLink>
          {user && (
            <NavLink to="/chats">
              הודעות
              {/* העיגול האדום מופיע רק כשיש הודעות שלא נקראו */}
              {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
            </NavLink>
          )}
          {user && <NavLink to="/favorites">מועדפים</NavLink>}
          {user && <NavLink to={`/user/${user.uid}`}>הפרופיל שלי</NavLink>}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/new" className="button">
                + פרסום מודעה
              </Link>
              {user.photoURL && <img src={user.photoURL} alt="" className="nav-avatar" />}
              <button className="button-ghost" onClick={logout}>
                התנתקות
              </button>
            </>
          ) : (
            <button onClick={login}>התחברות עם גוגל</button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
