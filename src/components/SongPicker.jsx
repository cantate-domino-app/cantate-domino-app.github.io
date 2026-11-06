import { useState, useMemo } from 'react'
import { useSongs } from '../context/SongsContext'
import { searchSongs } from '../lib/search'
import Icon from './Icon'

const MAX_RISULTATI = 8

// Scelta di un canto dell'archivio comune: mostra il canto scelto, oppure la ricerca
export default function SongPicker({ value, onChange, id }) {
    const { songs, searchIndex } = useSongs()
    const [cerca, setCerca] = useState('')
    const [aperto, setAperto] = useState(!value)
    const scelto = value && songs.find((s) => s.id.toLowerCase() === value.toLowerCase())

    const risultati = useMemo(
        () => (cerca.trim() ? searchSongs(searchIndex, cerca).slice(0, MAX_RISULTATI) : []),
        [searchIndex, cerca]
    )

    if (!aperto) {
        return (
            <div className="picker-chosen">
                <span className="song-row-id">{scelto?.id || value}</span>
                <span className="picker-title">{scelto?.title || 'Canto non in archivio'}</span>
                <button type="button" className="btn" onClick={() => setAperto(true)}>Cambia</button>
            </div>
        )
    }

    return (
        <div className="picker">
            <div className="search-bar-wrapper">
                <Icon name="search" />
                <input
                    id={id}
                    type="search"
                    className="main-search-input"
                    placeholder="Cerca titolo, autore o codice"
                    value={cerca}
                    onChange={(e) => setCerca(e.target.value)}
                />
            </div>
            {risultati.length > 0 && (
                <ul className="picker-results">
                    {risultati.map((s) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                className="picker-option"
                                onClick={() => {
                                    onChange(s.id)
                                    setCerca('')
                                    setAperto(false)
                                }}
                            >
                                <span className="song-row-id">{s.id}</span>
                                <span className="picker-title">{s.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {value && (
                <button type="button" className="btn" onClick={() => setAperto(false)}>Annulla</button>
            )}
        </div>
    )
}
