// טופס מודעה - משמש גם לפרסום מודעה חדשה וגם לעריכת מודעה קיימת.
// הכתובת /new      → מודעה חדשה (addDoc)
// הכתובת /edit/:id → עריכה של מודעה קיימת (updateDoc)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { CATEGORIES, CONDITIONS, REGIONS } from '../constants.js'
import { resizeImage } from '../utils/resizeImage.js'

function ListingForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  // ב-/edit/:id יש id, וב-/new אין - כך יודעים באיזה מצב אנחנו
  const { id } = useParams()
  const isEdit = Boolean(id)

  // כל שדה בטופס מחובר ל-state משלו ("controlled input")
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [condition, setCondition] = useState(CONDITIONS[0])
  const [region, setRegion] = useState(REGIONS[0])
  const [image, setImage] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // במצב עריכה: טוענים את המודעה ושומרים מי פרסם אותה
  const [loading, setLoading] = useState(isEdit)
  const [ownerId, setOwnerId] = useState(null)

  // במצב עריכה - ממלאים את הטופס בפרטים הקיימים של המודעה
  useEffect(() => {
    if (!id) return
    async function loadListing() {
      const snap = await getDoc(doc(db, 'listings', id))
      if (snap.exists()) {
        const data = snap.data()
        setTitle(data.title)
        setDescription(data.description || '')
        setPrice(data.price === 0 ? '' : String(data.price))
        setCategory(data.category)
        setCondition(data.condition)
        setRegion(data.region)
        setImage(data.image || '')
        setOwnerId(data.sellerId)
      }
      setLoading(false)
    }
    loadListing()
  }, [id])

  // רק משתמש מחובר יכול לפרסם
  if (!user) {
    return <p className="empty">צריך להתחבר כדי לפרסם מודעה.</p>
  }
  if (loading) return <p className="loading">טוען...</p>
  // רק מי שפרסם את המודעה יכול לערוך אותה
  if (isEdit && ownerId !== user.uid) {
    return <p className="empty">אפשר לערוך רק מודעות שפרסמת.</p>
  }

  async function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const small = await resizeImage(file)
    setImage(small)
  }

  async function handleSubmit(e) {
    // מונע מהדפדפן לרענן את הדף (זו ההתנהגות הרגילה של טופס)
    e.preventDefault()

    if (title.trim() === '') {
      setError('צריך למלא כותרת')
      return
    }

    // השדות שהמשתמש ממלא - זהים בפרסום ובעריכה
    const fields = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price) || 0, // שדה ריק או 0 = למסירה
      category,
      condition,
      region,
      image,
    }

    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        // updateDoc משנה רק את השדות ששלחנו. המוכר, הסטטוס ותאריך הפרסום נשארים
        await updateDoc(doc(db, 'listings', id), fields)
        navigate(`/listing/${id}`)
      } else {
        // addDoc יוצר מסמך חדש עם id אוטומטי
        const newDoc = await addDoc(collection(db, 'listings'), {
          ...fields,
          status: 'active',
          sellerId: user.uid,
          sellerName: user.displayName,
          createdAt: serverTimestamp(), // השעה נקבעת בשרת של Firebase
        })
        // אחרי השמירה - עוברים לעמוד של המודעה החדשה
        navigate(`/listing/${newDoc.id}`)
      }
    } catch (err) {
      setError('השמירה נכשלה: ' + err.message)
      setSaving(false)
    }
  }

  return (
    <div className="narrow">
      <div className="page-header">
        <h1>{isEdit ? 'עריכת מודעה' : 'פרסום מודעה חדשה'}</h1>
        <p>ככל שהפרטים מדויקים יותר, כך יותר קל למכור.</p>
      </div>

      <form className="panel form" onSubmit={handleSubmit}>
        <label>
          כותרת
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: וסט קרבי מידה L" />
        </label>

        <label>
          תיאור
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="מצב, מידה, למה מוכרים..."
          />
        </label>

        <div className="form-row">
          <label>
            מחיר בשקלים
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="ריק = למסירה בחינם"
            />
          </label>

          <label>
            קטגוריה
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            מצב
            <select value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            אזור
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          תמונה
          <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
        </label>
        {image && (
          <div className="preview-row">
            <img src={image} alt="תצוגה מקדימה" className="preview" />
            {/* type="button" - כדי שהלחיצה לא תשלח את הטופס */}
            <button type="button" className="button-ghost" onClick={() => setImage('')}>
              הסרת התמונה
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" className="button-large" disabled={saving}>
          {saving ? 'שומר...' : isEdit ? 'שמירת השינויים' : 'פרסום המודעה'}
        </button>
      </form>
    </div>
  )
}

export default ListingForm
