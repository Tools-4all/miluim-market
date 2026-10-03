// כרטיס של מודעה אחת ברשימה.
// מקבל את המודעה דרך props, ומציג תמונה, כותרת, מחיר ואזור.
import { Link } from 'react-router-dom'

function ListingCard({ listing }) {
  const isSold = listing.status === 'sold'

  return (
    <Link to={`/listing/${listing.id}`} className={isSold ? 'card card-sold' : 'card'}>
      <div className="card-image">
        {listing.image ? <img src={listing.image} alt={listing.title} /> : <span>אין תמונה</span>}
        {isSold && <span className="badge-sold">נמכר</span>}
      </div>

      <div className="card-body">
        <span className="pill">{listing.category}</span>
        <h3>{listing.title}</h3>
        <p className="price">{listing.price === 0 ? 'למסירה' : `${listing.price} ₪`}</p>
        <p className="card-meta">
          {listing.region} · {listing.condition}
        </p>
      </div>
    </Link>
  )
}

export default ListingCard
