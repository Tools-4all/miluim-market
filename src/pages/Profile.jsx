// עמוד פרופיל: פרטי המשתמש והמודעות שלו.
// אם זה הפרופיל שלי - אפשר גם לערוך טלפון, יחידה ועיר.
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import ListingCard from '../components/ListingCard.jsx'

function Profile() {
  const { uid } = useParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  // שדות לעריכה
  const [phone, setPhone] = useState('')
  const [unit, setUnit] = useState('')
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const userSnap = await getDoc(doc(db, 'users', uid))
      const data = userSnap.data() || {}
      setProfile(data)
      setPhone(data.phone || '')
      setUnit(data.unit || '')
      setCity(data.city || '')

      // where - מביא רק את המודעות שהמוכר שלהן הוא המשתמש הזה
      const q = query(collection(db, 'listings'), where('sellerId', '==', uid))
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      // מיון מהחדש לישן (createdAt הוא זמן של Firebase, יש לו שדה seconds)
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setListings(items)
      setLoading(false)
    }
    load()
  }, [uid])

  async function handleSave(e) {
    e.preventDefault()
    await setDoc(doc(db, 'users', uid), { phone, unit, city }, { merge: true })
    setMessage('נשמר!')
  }

  if (loading) return <p className="loading">טוען...</p>

  const isMe = user && user.uid === uid
  // כמה מהמודעות עדיין פעילות (לא נמכרו)
  const activeCount = listings.filter((item) => item.status !== 'sold').length

  return (
    <div>
      <div className="panel profile-header">
        {profile.photo && <img src={profile.photo} alt="" className="avatar" />}
        <div className="profile-details">
          <h1>{profile.name || 'משתמש'}</h1>
          <p className="card-meta">
            {profile.unit && `יחידה: ${profile.unit}`} {profile.city && ` · ${profile.city}`}
          </p>
        </div>
        <div className="stats">
          <div>
            <strong>{listings.length}</strong>
            <span>מודעות</span>
          </div>
          <div>
            <strong>{activeCount}</strong>
            <span>פעילות</span>
          </div>
        </div>
      </div>

      {isMe && (
        <form className="panel form" onSubmit={handleSave}>
          <h2>הפרטים שלי</h2>
          <div className="form-row form-row-3">
            <label>
              טלפון (לוואטסאפ)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" />
            </label>
            <label>
              יחידה
              <input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
            <label>
              עיר
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
          </div>
          <div className="form-footer">
            <button type="submit">שמירת הפרטים</button>
            {message && <span className="success">{message}</span>}
          </div>
        </form>
      )}

      <h2 className="section-title">{isMe ? 'המודעות שלי' : `המודעות של ${profile.name || 'המשתמש'}`}</h2>
      {listings.length === 0 && <p className="empty">עוד אין מודעות.</p>}
      <div className="grid">
        {listings.map((item) => (
          <ListingCard key={item.id} listing={item} />
        ))}
      </div>
    </div>
  )
}

export default Profile
