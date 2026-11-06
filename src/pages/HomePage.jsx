import { useState, useMemo } from 'react'
import { useSongs } from '../context/SongsContext'
import { searchSongs } from '../lib/search'
import { isTempo } from '../lib/tags'
import SongCard from '../components/SongCard'
import Icon from '../components/Icon'

const TUTTI = 'tutti'

function TagRow({ label, tags, selected, onSelect }) {
    if (tags.length === 0) return null
    return (
        <div className="tag-row" role="group" aria-label={label}>
            <span className="tag-row-label">{label}</span>
            <div className="tags-scroll-container">
                {[TUTTI, ...tags].map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        className={`tag-chip ${selected === tag ? 'active' : ''}`}
                        aria-pressed={selected === tag}
                        onClick={() => onSelect(tag)}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function HomePage() {
    const { songs, searchIndex, loading, error } = useSongs()
    const [search, setSearch] = useState('')
    const [selectedMomento, setSelectedMomento] = useState(TUTTI)
    const [selectedTempo, setSelectedTempo] = useState(TUTTI)
    const [soloRaccoglitore, setSoloRaccoglitore] = useState(false)
    const qualcunoFuori = useMemo(() => songs.some((s) => !s.binder), [songs])

    // Tag distinti divisi tra momenti della messa e tempi liturgici, in ordine alfabetico
    const { momenti, tempi } = useMemo(() => {
        const set = new Set()
        songs.forEach((song) => song.tags.forEach((tag) => tag && set.add(tag)))
        const all = Array.from(set).sort((a, b) => a.localeCompare(b, 'it'))
        return { momenti: all.filter((t) => !isTempo(t)), tempi: all.filter(isTempo) }
    }, [songs])

    // Ricerca testuale, poi filtro per momento e tempo (entrambi devono valere)
    const filteredSongs = useMemo(() => {
        return searchSongs(searchIndex, search).filter((song) =>
            (selectedMomento === TUTTI || song.tags.includes(selectedMomento)) &&
            (selectedTempo === TUTTI || song.tags.includes(selectedTempo)) &&
            (!soloRaccoglitore || song.binder)
        )
    }, [searchIndex, search, selectedMomento, selectedTempo, soloRaccoglitore])

    const activeFilters = [selectedMomento, selectedTempo].filter((t) => t !== TUTTI)

    if (loading) {
        return <p className="status-message">Caricamento dell'archivio canti...</p>
    }

    if (error) {
        return <p className="status-message error">{error}</p>
    }

    return (
        <section className="home-page">
            <div className="search-bar-wrapper">
                <Icon name="search" />
                <input
                    type="search"
                    className="main-search-input"
                    placeholder="Titolo, autore, codice o parole"
                    aria-label="Cerca un canto"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        type="button"
                        className="icon-btn clear-search-btn"
                        aria-label="Cancella ricerca"
                        onClick={() => setSearch('')}
                    >
                        <Icon name="close" size={20} />
                    </button>
                )}
            </div>

            <TagRow label="Momento" tags={momenti} selected={selectedMomento} onSelect={setSelectedMomento} />
            <TagRow label="Tempo liturgico" tags={tempi} selected={selectedTempo} onSelect={setSelectedTempo} />

            <div className="results-header">
                <span>
                    {filteredSongs.length} {filteredSongs.length === 1 ? 'canto trovato' : 'canti trovati'}
                </span>
                {qualcunoFuori && (
                    <button
                        type="button"
                        className={`tag-chip ${soloRaccoglitore ? 'active' : ''}`}
                        aria-pressed={soloRaccoglitore}
                        onClick={() => setSoloRaccoglitore((v) => !v)}
                    >
                        Solo nel raccoglitore
                    </button>
                )}
                {activeFilters.length > 0 && (
                    <button
                        type="button"
                        className="reset-filter-btn"
                        onClick={() => {
                            setSelectedMomento(TUTTI)
                            setSelectedTempo(TUTTI)
                        }}
                    >
                        Togli filtri: {activeFilters.join(' + ')}
                        <Icon name="close" size={18} />
                    </button>
                )}
            </div>

            <div className="songs-list">
                {filteredSongs.map((song) => (
                    <SongCard key={song.id || song.title} song={song} />
                ))}

                {filteredSongs.length === 0 && (
                    <div className="empty-results">
                        <p>Nessun canto corrisponde ai criteri di ricerca.</p>
                    </div>
                )}
            </div>
        </section>
    )
}
