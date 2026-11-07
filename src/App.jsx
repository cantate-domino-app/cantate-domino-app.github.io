import { HashRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { SongsProvider } from './context/SongsContext'
import { AdminProvider } from './context/AdminContext'
import { ThemeProvider } from './context/ThemeContext'
import { ParrocchiaProvider, useParrocchia } from './context/ParrocchiaContext'

import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import SongPage from './pages/SongPage'
import DailySongsPage from './pages/DailySongsPage'
import SuggestPage from './pages/SuggestPage'
import AdminPage from './pages/AdminPage'
import ParishPickerPage from './pages/ParishPickerPage'
import EditCelebrationsPage from './pages/EditCelebrationsPage'
import AddParishPage from './pages/AddParishPage'
import './App.css'

// Vecchi link condivisi (#/daily?celebrazione=...): portano alla parrocchia scelta l'ultima volta
function VecchioLinkCelebrazioni() {
  const { slug } = useParrocchia()
  const [params] = useSearchParams()
  const celebrazione = params.get('celebrazione') || params.get('messa')
  if (!slug) return <Navigate to="/celebrazioni" replace />
  return <Navigate to={`/celebrazioni/${slug}${celebrazione ? `?c=${encodeURIComponent(celebrazione)}` : ''}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <SongsProvider>
        <ParrocchiaProvider>
        <AdminProvider>
          <Router>
            <div className="app-layout">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/song/:id" element={<SongPage />} />
                  <Route path="/celebrazioni" element={<ParishPickerPage />} />
                  <Route path="/aggiungi-parrocchia" element={<AddParishPage />} />
                  <Route path="/celebrazioni/:slug" element={<DailySongsPage />} />
                  <Route path="/celebrazioni/:slug/modifica" element={<EditCelebrationsPage />} />
                  <Route path="/daily" element={<VecchioLinkCelebrazioni />} />
                  <Route path="/suggest" element={<SuggestPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </main>
            </div>
          </Router>
        </AdminProvider>
        </ParrocchiaProvider>
      </SongsProvider>
    </ThemeProvider>
  )
}