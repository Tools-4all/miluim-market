// המודעות ששמרתי במועדפים.
// במסמך המשתמש יש מערך favorites עם מזהים (id) של מודעות - טוענים כל אחת מהן.
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import ListingCard from '../components/ListingCard.jsx'

function Favorites() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const mySnap = await getDoc(doc(db, 'users', user.uid))
      const ids = mySnap.data()?.favorites || []

      // Promise.all - שולח את כל הבקשות ביחד ומחכה שכולן יחזרו
      const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'listings', id))))
      const items = snaps
        .filter((s) => s.exists()) // מודעה שנמחקה לא תופיע
        .map((s) => ({ id: s.id, ...s.data() }))
      setListings(items)
      setLoading(false)
    }
    load()
  }, [user])

  if (!user) return <p className="empty">צריך להתחבר כדי לראות מועדפים.</p>
  if (loading) return <p className="loading">טוען...</p>

  return (
    <div>
      <div className="page-header">
        <h1>המועדפים שלי</h1>
        <p>מודעות ששמרת כדי לחזור אליהן.</p>
      </div>
      {listings.length === 0 && <p className="empty">עוד לא שמרת מודעות.</p>}
      <div className="grid">
        {listings.map((item) => (
          <ListingCard key={item.id} listing={item} />
        ))}
      </div>
    </div>
  )
}

export default Favorites
