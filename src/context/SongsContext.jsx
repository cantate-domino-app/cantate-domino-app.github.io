import { createContext, useContext, useMemo } from 'react'
import { useCachedCsv } from '../hooks/useCachedCsv'
import { buildSearchIndex } from '../lib/search'
import { BASE } from '../config'

// Catalogo statico generato dalla GitHub Action (scripts/scarica-catalogo.mjs)
const CATALOGO_URL = `${BASE}canti.json`
const CACHE_KEY = 'cached_songs_catalog_json'

function parseCatalogo(testo) {
    const canti = JSON.parse(testo).canti || []
    return canti
        .filter((item) => item.Titolo && item.Titolo.trim() !== '')
        .map((item) => ({
            id: (item.ID || '').trim(),
            title: item.Titolo.trim(),
            author: (item.Autori || '').trim(),
            tags: item.Tag ? item.Tag.split(',').map((t) => t.trim().toLowerCase()) : [],
            youtube: (item['Link Youtube'] || '').trim(),
            sheetOriginal: (item['Spartito Originale'] || '').trim(),
            sheetModified: (item['Spartito Modificato'] || '').trim(),
            lyrics: (item.Testo || '').trim(),
            notes: (item.Note || '').trim(),
        }))
}

const isEmpty = (songs) => songs.length === 0
const NO_SONGS = []

const SongsContext = createContext()

export function SongsProvider({ children }) {
    const { data, loading, error: loadError } = useCachedCsv(CATALOGO_URL, CACHE_KEY, parseCatalogo, isEmpty)
    const songs = data || NO_SONGS
    const searchIndex = useMemo(() => buildSearchIndex(songs), [songs])
    const error = loadError ? 'Errore durante il caricamento dei canti.' : null

    return (
        <SongsContext.Provider value={{ songs, searchIndex, loading, error }}>
            {children}
        </SongsContext.Provider>
    )
}

// Hook personalizzato per usare il contesto ovunque
export function useSongs() {
    return useContext(SongsContext)
}