// App - הקומפוננטה הראשית. קובעת איזה עמוד מוצג לפי הכתובת.
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import ListingForm from './pages/ListingForm.jsx'
import ListingDetails from './pages/ListingDetails.jsx'
import Profile from './pages/Profile.jsx'
import Favorites from './pages/Favorites.jsx'
import Chats from './pages/Chats.jsx'
import Chat from './pages/Chat.jsx'

function App() {
  const { loading } = useAuth()

  // עד ש-Firebase יודע אם יש משתמש מחובר - לא מציגים עמודים,
  // אחרת לרגע היה נראה כאילו המשתמש לא מחובר
  if (loading) return <p className="loading">טוען...</p>

  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* אותו טופס משמש לפרסום ולעריכה */}
          <Route path="/new" element={<ListingForm />} />
          <Route path="/edit/:id" element={<ListingForm />} />
          {/* :id הוא פרמטר - החלק בכתובת שמשתנה לכל מודעה */}
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/user/:uid" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="*" element={<p className="empty">העמוד לא נמצא.</p>} />
        </Routes>
      </main>
      <footer className="footer">
        מילואימרקט · ציוד יד שנייה למילואימניקים
      </footer>
    </div>
  )
}

export default App
