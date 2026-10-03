// העמוד הראשי - כל המודעות, עם חיפוש וסינון
import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase.js'
import { CATEGORIES, REGIONS } from '../constants.js'
import ListingCard from '../components/ListingCard.jsx'

function Home() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  // ה-state של הסינון - כל שינוי בשדות מעדכן אותם
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('')
  const [hideSold, setHideSold] = useState(false)

  // useEffect עם [] רץ פעם אחת, כשהעמוד נטען - שם טוענים את המודעות מ-Firestore
  useEffect(() => {
    async function loadListings() {
      // שאילתה: כל המודעות, מהחדשה לישנה
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      // כל מסמך הופך לאובייקט רגיל, ומוסיפים לו את ה-id שלו
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setListings(data)
      setLoading(false)
    }
    loadListings()
  }, [])

  // הסינון נעשה בדפדפן: מתוך כל המודעות משאירים רק את אלה שמתאימות
  const filtered = listings.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false
    if (category && item.category !== category) return false
    if (region && item.region !== region) return false
    if (hideSold && item.status === 'sold') return false
    return true
  })

  return (
    <div>
      <section className="hero">
        <h1>ציוד למילואימניקים, ממילואימניקים</h1>
        <p>קונים ומוכרים ציוד אישי יד שנייה - וסטים, תיקים, הנעלה ועוד - ישירות מחברים למילואים.</p>
      </section>

      <div className="filters">
        <input
          type="search"
          className="filters-search"
          placeholder="חיפוש לפי שם המוצר..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">כל הקטגוריות</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">כל האזורים</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="checkbox">
          <input type="checkbox" checked={hideSold} onChange={(e) => setHideSold(e.target.checked)} />
          הסתר מודעות שנמכרו
        </label>
      </div>

      {loading && <p className="loading">טוען מודעות...</p>}
      {!loading && (
        <p className="results-count">
          {filtered.length} מודעות
        </p>
      )}
      {!loading && filtered.length === 0 && (
        <div className="empty">
          <h3>לא נמצאו מודעות</h3>
          <p>נסו לשנות את החיפוש או את הסינון.</p>
        </div>
      )}

      <div className="grid">
        {filtered.map((item) => (
          <ListingCard key={item.id} listing={item} />
        ))}
      </div>
    </div>
  )
}

export default Home
