// עמוד של מודעה אחת: פרטים, יצירת קשר, מועדפים, תגובות.
// בעל המודעה רואה גם כפתורים לסמן "נמכר" ולמחוק.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Comments from '../components/Comments.jsx'

// הופך מספר כמו 050-1234567 לקישור וואטסאפ: https://wa.me/972501234567
function whatsappLink(phone) {
  const digits = phone.replace(/\D/g, '') // משאיר רק ספרות
  const international = digits.startsWith('0') ? '972' + digits.slice(1) : digits
  return `https://wa.me/${international}`
}

function ListingDetails() {
  // useParams נותן את ה-:id מהכתובת /listing/:id
  const { id } = useParams()
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  // טוענים את המודעה ואת פרטי המוכר. רץ מחדש אם ה-id בכתובת משתנה
  useEffect(() => {
    async function load() {
      const listingSnap = await getDoc(doc(db, 'listings', id))
      if (!listingSnap.exists()) {
        setLoading(false)
        return
      }
      const data = { id: listingSnap.id, ...listingSnap.data() }
      setListing(data)

      const sellerSnap = await getDoc(doc(db, 'users', data.sellerId))
      setSeller(sellerSnap.data())
      setLoading(false)
    }
    load()
  }, [id])

  // בודקים אם המודעה כבר במועדפים של המשתמש המחובר
  useEffect(() => {
    async function checkFavorite() {
      if (!user) return
      const mySnap = await getDoc(doc(db, 'users', user.uid))
      const favorites = mySnap.data()?.favorites || []
      setIsFavorite(favorites.includes(id))
    }
    checkFavorite()
  }, [user, id])

  async function toggleFavorite() {
    const myRef = doc(db, 'users', user.uid)
    // arrayUnion מוסיף למערך, arrayRemove מוריד ממנו - בלי לקרוא את המערך קודם
    await setDoc(myRef, { favorites: isFavorite ? arrayRemove(id) : arrayUnion(id) }, { merge: true })
    setIsFavorite(!isFavorite)
  }

  // פותח שיחה פרטית עם המוכר.
  // ה-id של השיחה בנוי מהמודעה ומהקונה, כך שלכל קונה יש שיחה אחת לכל מודעה,
  // ולחיצה חוזרת פותחת את אותה שיחה במקום ליצור חדשה.
  async function startChat() {
    const chatId = `${id}_${user.uid}`
    await setDoc(
      doc(db, 'chats', chatId),
      {
        listingId: id,
        listingTitle: listing.title,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        buyerId: user.uid,
        buyerName: user.displayName,
        participants: [listing.sellerId, user.uid],
      },
      { merge: true },
    )
    navigate(`/chat/${chatId}`)
  }

  async function markAsSold() {
    const newStatus = listing.status === 'sold' ? 'active' : 'sold'
    await updateDoc(doc(db, 'listings', id), { status: newStatus })
    // מעדכנים גם את ה-state כדי שהמסך יתעדכן מיד
    setListing({ ...listing, status: newStatus })
  }

  async function deleteListing() {
    if (!window.confirm('למחוק את המודעה?')) return
    // Firestore לא מוחק תת-אוסף יחד עם המסמך, אז קודם מוחקים את כל התגובות
    const commentsSnap = await getDocs(collection(db, 'listings', id, 'comments'))
    await Promise.all(commentsSnap.docs.map((c) => deleteDoc(c.ref)))
    await deleteDoc(doc(db, 'listings', id))
    navigate('/')
  }

  if (loading) return <p className="loading">טוען...</p>
  if (!listing) return <p className="empty">המודעה לא נמצאה.</p>

  // האם המשתמש המחובר הוא מי שפרסם את המודעה?
  const isOwner = user && user.uid === listing.sellerId
  // createdAt הוא Timestamp של Firebase. toDate() הופך אותו לתאריך רגיל של JavaScript
  const date = listing.createdAt ? listing.createdAt.toDate().toLocaleDateString('he-IL') : ''

  return (
    <div>
      <Link to="/" className="back-link">
        → חזרה לכל המודעות
      </Link>

      <div className="details">
        <div className="details-image">
          {listing.image ? <img src={listing.image} alt={listing.title} /> : <span>אין תמונה</span>}
        </div>

        <div className="panel details-info">
          <div className="pills">
            {listing.status === 'sold' && <span className="badge-sold">נמכר</span>}
            <span className="pill">{listing.category}</span>
            <span className="pill">{listing.condition}</span>
          </div>

          <h1>{listing.title}</h1>
          <p className="price price-large">{listing.price === 0 ? 'למסירה' : `${listing.price} ₪`}</p>
          <p className="card-meta">
            {listing.region} {date && `· פורסם ב-${date}`}
          </p>

          {listing.description && <p className="description">{listing.description}</p>}

          <Link to={`/user/${listing.sellerId}`} className="seller-box">
            {seller?.photo && <img src={seller.photo} alt="" className="avatar-small" />}
            <div>
              <strong>{listing.sellerName}</strong>
              <span className="card-meta">{seller?.unit ? `יחידה: ${seller.unit}` : 'לפרופיל המוכר'}</span>
            </div>
          </Link>

          <div className="actions">
            {/* פנייה למוכר: הודעה באתר, ואם המוכר מילא טלפון - גם וואטסאפ */}
            {user && !isOwner && (
              <button className="button-large" onClick={startChat}>
                שליחת הודעה למוכר
              </button>
            )}
            {!user && (
              <button className="button-large" onClick={login}>
                התחברו כדי לפנות למוכר
              </button>
            )}

            {seller?.phone && !isOwner && (
              <a href={whatsappLink(seller.phone)} target="_blank" rel="noreferrer" className="button button-whatsapp">
                וואטסאפ
              </a>
            )}

            {user && !isOwner && (
              <button className="button-secondary" onClick={toggleFavorite}>
                {isFavorite ? '★ במועדפים' : '☆ הוספה למועדפים'}
              </button>
            )}

            {isOwner && (
              <>
                <Link to={`/edit/${id}`} className="button">
                  עריכת המודעה
                </Link>
                <button className="button-secondary" onClick={markAsSold}>
                  {listing.status === 'sold' ? 'החזרה למכירה' : 'סימון כנמכר'}
                </button>
                <button onClick={deleteListing} className="button-danger">
                  מחיקת המודעה
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Comments listingId={id} />
    </div>
  )
}

export default ListingDetails
