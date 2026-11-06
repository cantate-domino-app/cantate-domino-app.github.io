import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Papa from 'papaparse'
import { useSongs } from '../context/SongsContext'
import { useCachedCsv } from '../hooks/useCachedCsv'
import { useFontSize } from '../hooks/useFontSize'
import { useWakeLock } from '../hooks/useWakeLock'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'

const NO_ROWS = []

const CELEBRAZIONI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOuSn2F5KZV-TYnF3yS92H_nEFYCPX_v-VmLtR4nqNXkh6tls7E94FP0ciMGomsPh5H-YBc4lBGFLH/pub?gid=1649967796&single=true&output=csv'
const CELEBRAZIONI_CACHE_KEY = 'cached_celebrations_schedule_csv'

function getCelebrationIcon(name) {
    const lower = (name || '').toLowerCase()
    if (lower.includes('adorazion') || lower.includes('gioved')) return '🕯️'
    if (lower.includes('fanciull') || lower.includes('bambin') || lower.includes('10:30')) return '👦'
    if (lower.includes('veglia') || lower.includes('notte')) return '✨'
    return '⛪'
}

function parseCelebrationCsv(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
    })

    if (!results.data || results.data.length === 0) {
        return { parsedRows: [], uniqueCelebs: [] }
    }

    const firstRow = results.data[0] || {}
    const keys = Object.keys(firstRow)

    const celebCol = keys.find((k) => /^(celebrazione|evento|gruppo)/i.test(k.trim()))
    const momentCol = keys.find((k) => /^momento/i.test(k.trim())) || 'Momento'
    const songCol = keys.find((k) => /^(canto_id|canto|id)/i.test(k.trim())) || 'Canto_ID'
    const noteCol = keys.find((k) => /^note/i.test(k.trim())) || 'Note'

    const parsedRows = []
    let runningCelebration = 'Generale'

    // 1. Formato Verticale principale (colonna Celebrazione presente)
    if (celebCol) {
        results.data.forEach((item, index) => {
            const rawCeleb = (item[celebCol] || '').trim()
            if (rawCeleb) {
                runningCelebration = rawCeleb
            }

            const songId = (item[songCol] || '').trim()
            const moment = (item[momentCol] || '').trim()
            const notes = (item[noteCol] || '').trim()

            if (songId) {
                parsedRows.push({
                    keyId: `${runningCelebration}-${moment || 'momento'}-${index}`,
                    celebration: runningCelebration,
                    moment: moment || 'Momento',
                    songId,
                    notes
                })
            }
        })
    } else {
        // 2. Fallback per colonne orizzontali precedenti (Messa 10:30, Messa 12:15, Adorazione...)
        const celebrationColumns = keys.filter((k) =>
            /^(messa|adorazione|veglia)/i.test(k.trim())
        )

        if (celebrationColumns.length > 0) {
            celebrationColumns.forEach((colName) => {
                const trimmedCol = colName.trim()
                results.data.forEach((item, index) => {
                    const songId = (item[colName] || '').trim()
                    const moment = (item[momentCol] || '').trim()
                    const notes = (item[noteCol] || '').trim()

                    if (songId) {
                        parsedRows.push({
                            keyId: `${trimmedCol}-${moment || 'momento'}-${index}`,
                            celebration: trimmedCol,
                            moment: moment || 'Momento',
                            songId,
                            notes
                        })
                    }
                })
            })
        } else {
            // 3. Fallback standard
            results.data.forEach((item, index) => {
                const songId = (item[songCol] || '').trim()
                if (songId) {
                    parsedRows.push({
                        keyId: `generale-${item[momentCol] || 'momento'}-${index}`,
                        celebration: 'Celebrazione',
                        moment: (item[momentCol] || '').trim() || 'Momento',
                        songId,
                        notes: (item[noteCol] || '').trim()
                    })
                }
            })
        }
    }

    const uniqueCelebs = []
    parsedRows.forEach((r) => {
        if (!uniqueCelebs.includes(r.celebration)) {
            uniqueCelebs.push(r.celebration)
        }
    })

    return { parsedRows, uniqueCelebs }
}

const isScheduleEmpty = (schedule) => schedule.parsedRows.length === 0

export default function DailySongsPage() {
    const { songs, loading: songsLoading } = useSongs()
    const [searchParams, setSearchParams] = useSearchParams()
    const {
        data: schedule,
        loading: loadingSchedule,
        error: scheduleError,
    } = useCachedCsv(CELEBRAZIONI_CSV_URL, CELEBRAZIONI_CACHE_KEY, parseCelebrationCsv, isScheduleEmpty)
    const errorSchedule = scheduleError ? 'Impossibile caricare i canti della celebrazione.' : null
    const [copied, setCopied] = useState(false)

    const [fontSize, setFontSize] = useFontSize()
    const wakeLock = useWakeLock()

    // Testi aperti di default: si tiene traccia solo di quelli chiusi
    const [collapsedLyrics, setCollapsedLyrics] = useState({})

    const allScheduleRows = schedule?.parsedRows ?? NO_ROWS
    const celebrations = schedule?.uniqueCelebs ?? NO_ROWS

    // Celebrazione attiva: parametro URL (anche legacy ?messa=), poi ultima scelta, poi la prima
    const urlParam = searchParams.get('celebrazione') || searchParams.get('messa')
    const activeCelebration = useMemo(() => {
        const fromUrl = urlParam && celebrations.find((c) => c.toLowerCase() === urlParam.toLowerCase())
        if (fromUrl) return fromUrl
        const saved = localStorage.getItem('active_celebration')
        if (saved && celebrations.includes(saved)) return saved
        return celebrations[0] || ''
    }, [urlParam, celebrations])

    const toggleLyrics = (keyId) => {
        setCollapsedLyrics((prev) => ({
            ...prev,
            [keyId]: !prev[keyId]
        }))
    }

    const handleSelectCelebration = (celeb) => {
        localStorage.setItem('active_celebration', celeb)
        setSearchParams({ celebrazione: celeb }, { replace: true })
    }

    // Filtra per celebrazione attiva
    const currentSchedule = useMemo(() => {
        if (!activeCelebration) return allScheduleRows
        return allScheduleRows.filter((r) => r.celebration === activeCelebration)
    }, [allScheduleRows, activeCelebration])

    const matchedSchedule = useMemo(() => {
        return currentSchedule.map((item) => {
            const fullSong = songs.find(
                (s) => s.id.toLowerCase() === item.songId.toLowerCase()
            )
            return {
                ...item,
                song: fullSong || null
            }
        })
    }, [currentSchedule, songs])

    const handleShareSchedule = async () => {
        const titleText = activeCelebration
            ? `Canti: ${activeCelebration}`
            : 'Canti per la Celebrazione'

        const base = window.location.origin + window.location.pathname
        const shareUrl = `${base}#/daily?celebrazione=${encodeURIComponent(activeCelebration)}`
        const shareText = `🎶 *${titleText} — Parrocchia Santa Chiara*\nEcco i canti scelti con testi e spartiti:\n${shareUrl}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${titleText} — Parrocchia Santa Chiara`,
                    text: `🎶 ${titleText} — Parrocchia Santa Chiara\nEcco i canti scelti con testi e spartiti:`,
                    url: shareUrl,
                })
                return
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }

        try {
            await navigator.clipboard.writeText(shareText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch (err) {
            console.error('Errore copia link:', err)
        }
    }

    if (songsLoading || loadingSchedule) {
        return <p className="status-message">Caricamento dei canti per la celebrazione...</p>
    }

    if (errorSchedule) {
        return <p className="status-message error">{errorSchedule}</p>
    }

    return (
        <section className="daily-page-container">
            <header className="daily-header">
                <div>
                    <h2>{activeCelebration || 'Canti per la Celebrazione'}</h2>
                    <p className="daily-subtitle">Guida musicale e testi per la liturgia</p>
                </div>

                <div className="daily-header-actions">
                    <FontSizeControls fontSize={fontSize} setFontSize={setFontSize} />

                    {wakeLock.supported && (
                        <button
                            type="button"
                            className={`tool-button ${wakeLock.active ? 'active' : ''}`}
                            onClick={wakeLock.toggle}
                            aria-pressed={wakeLock.active}
                            title="Mantieni lo schermo acceso durante la celebrazione"
                        >
                            {wakeLock.active ? '☀️ Schermo Attivo (ON)' : '🌙 Schermo Normale'}
                        </button>
                    )}

                    {matchedSchedule.length > 0 && (
                        <button
                            type="button"
                            className="whatsapp-copy-btn"
                            onClick={handleShareSchedule}
                            title="Condividi i canti di questa celebrazione"
                        >
                            {copied ? '✓ Link Copiato!' : '🔗 Condividi Canti'}
                        </button>
                    )}
                </div>
            </header>

            {/* Selettore a schede per le celebrazioni */}
            {celebrations.length > 1 && (
                <div className="celebration-tabs-nav" role="tablist" aria-label="Seleziona celebrazione">
                    {celebrations.map((celeb) => (
                        <button
                            key={celeb}
                            type="button"
                            role="tab"
                            aria-selected={activeCelebration === celeb}
                            className={`celebration-tab-btn ${activeCelebration === celeb ? 'active' : ''}`}
                            onClick={() => handleSelectCelebration(celeb)}
                        >
                            <span className="tab-icon">{getCelebrationIcon(celeb)}</span>
                            <span className="tab-label">{celeb}</span>
                        </button>
                    ))}
                </div>
            )}

            {matchedSchedule.length === 0 ? (
                <div className="empty-schedule">
                    <p>Nessun canto programmato al momento per questa celebrazione.</p>
                </div>
            ) : (
                <div className="schedule-timeline">
                    {matchedSchedule.map((item) => {
                        const isOpen = !collapsedLyrics[item.keyId]

                        return (
                            <article key={item.keyId} className="timeline-item">
                                <div className="timeline-badge-moment">
                                    <span>{item.moment}</span>
                                </div>

                                <div className="timeline-content-card">
                                    <div className="timeline-card-header">
                                        <div className="timeline-title-wrap">
                                            {item.song?.id && (
                                                <span className="card-id">{item.song.id}</span>
                                            )}
                                            <h3>{item.song ? item.song.title : `Canto ${item.songId}`}</h3>
                                        </div>
                                        {item.song?.author && (
                                            <span className="timeline-author">{item.song.author}</span>
                                        )}
                                    </div>

                                    {item.notes && (
                                        <div className="timeline-notes">
                                            <strong>Note:</strong> {item.notes}
                                        </div>
                                    )}

                                    <div className="timeline-card-controls">
                                        <button
                                            type="button"
                                            className="toggle-lyrics-btn"
                                            onClick={() => toggleLyrics(item.keyId)}
                                        >
                                            {isOpen ? '▲ Nascondi Testo' : '▼ Mostra Testo'}
                                        </button>

                                        <div className="timeline-right-links">
                                            {item.song?.youtube && (
                                                <a
                                                    href={item.song.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="youtube-badge"
                                                >
                                                    ▶ YouTube
                                                </a>
                                            )}
                                            {/* Passaggio di state: { from: 'daily' } */}
                                            <Link
                                                to={`/song/${item.songId}`}
                                                state={{ from: 'daily' }}
                                                className="details-btn"
                                            >
                                                Spartiti ↗
                                            </Link>
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="timeline-lyrics-box">
                                            {item.song?.lyrics ? (
                                                <SongLyrics rawLyrics={item.song.lyrics} fontSize={fontSize} />
                                            ) : (
                                                <p className="no-lyrics">Testo non ancora inserito per questo canto.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}