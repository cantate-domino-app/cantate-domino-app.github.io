import { useState, useMemo } from 'react'
import { useSongs } from '../context/SongsContext'
import { useRaccoglitore } from '../context/ParrocchiaContext'
import { searchSongs } from '../lib/search'
import Icon from './Icon'

const MAX_RISULTATI = 8

// Scelta di un canto dell'archivio comune: mostra il canto scelto, oppure la ricerca
export default function SongPicker({ value, onChange, id }) {
    const { songs, searchIndex } = useSongs()
    const raccoglitore = useRaccoglitore()
    const [cerca, setCerca] = useState('')
    const [aperto, setAperto] = useState(!value)
    const scelto = value && songs.find((s) => s.id.toLowerCase() === value.toLowerCase())

    const risultati = useMemo(
        () => (cerca.trim() ? searchSongs(searchIndex, cerca, raccoglitore.riferimento).slice(0, MAX_RISULTATI) : []),
        [searchIndex, cerca, raccoglitore]
    )

    if (!aperto) {
        return (
            <div className="picker-chosen">
                <span className="song-row-id">{scelto ? raccoglitore.riferimento(scelto.id) : value}</span>
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
                    placeholder="Cerca titolo o autore"
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
                                className={`picker-option ${raccoglitore.conCanti ? '' : 'senza-riferimenti'}`}
                                onClick={() => {
                                    onChange(s.id)
                                    setCerca('')
                                    setAperto(false)
                                }}
                            >
                                {raccoglitore.conCanti && <span className="song-row-id">{raccoglitore.riferimento(s.id)}</span>}
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
