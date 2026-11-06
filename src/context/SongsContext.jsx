import { createContext, useContext, useMemo } from 'react'
import Papa from 'papaparse'
import { useCachedCsv } from '../hooks/useCachedCsv'
import { buildSearchIndex } from '../lib/search'

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=0&single=true&output=csv'
const CACHE_KEY = 'cached_songs_catalog_csv'

function parseCsvData(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    })
    return (results.data || [])
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
            notes: (item.Note || '').trim()
        }))
}

const isEmpty = (songs) => songs.length === 0
const NO_SONGS = []

const SongsContext = createContext()

export function SongsProvider({ children }) {
    const { data, loading, error: loadError } = useCachedCsv(CSV_URL, CACHE_KEY, parseCsvData, isEmpty)
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