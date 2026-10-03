// נקודת הכניסה של האפליקציה - מכאן React מתחיל לצייר את הדף
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* HashRouter - מאפשר מעבר בין עמודים. כתובות נראות כך: /#/listing/123 */}
    <HashRouter>
      {/* AuthProvider - נותן לכל הקומפוננטות לדעת מי המשתמש המחובר */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
