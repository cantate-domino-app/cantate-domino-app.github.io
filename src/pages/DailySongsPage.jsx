import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { useSongs } from '../context/SongsContext'
import { useParrocchia } from '../context/ParrocchiaContext'
import { useFontSize } from '../hooks/useFontSize'
import { useWakeLock } from '../hooks/useWakeLock'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'
import Icon from '../components/Icon'

const NO_ROWS = []

// Righe dal server → celebrazioni nell'ordine in cui compaiono, canti per "ordine"
function raggruppa(righe) {
    const celebrazioni = []
    righe.forEach((r) => {
        if (!celebrazioni.includes(r.celebrazione)) celebrazioni.push(r.celebrazione)
    })
    const parsedRows = [...righe]
        .sort((a, b) => celebrazioni.indexOf(a.celebrazione) - celebrazioni.indexOf(b.celebrazione) || a.ordine - b.ordine)
        .map((r) => ({
            keyId: `${r.celebrazione}-${r.ordine}`,
            celebration: r.celebrazione,
            moment: r.momento || 'Momento',
            songId: r.cantoId,
            notes: r.note || '',
        }))
    return { parsedRows, uniqueCelebs: celebrazioni }
}

export default function DailySongsPage() {
    const { slug: slugUrl } = useParams()
    const { songs, loading: songsLoading } = useSongs()
    const [searchParams, setSearchParams] = useSearchParams()
    const { slug, scegli, dati, loading: loadingSchedule, error: scheduleError } = useParrocchia()

    // Il link condiviso decide la parrocchia
    useEffect(() => {
        if (slugUrl && slugUrl !== slug) scegli(slugUrl)
    }, [slugUrl, slug, scegli])

    const schedule = useMemo(() => (dati ? raggruppa(dati.righe) : null), [dati])
    const nomeParrocchia = dati?.parrocchia?.nome || ''
    const errorSchedule = scheduleError
    const [copied, setCopied] = useState(false)

    const [fontSize, setFontSize] = useFontSize()
    const wakeLock = useWakeLock()

    const [showTextSize, setShowTextSize] = useState(false)

    // Testi chiusi di default: si apre una riga alla volta
    const [openLyrics, setOpenLyrics] = useState({})

    const allScheduleRows = schedule?.parsedRows ?? NO_ROWS
    const celebrations = schedule?.uniqueCelebs ?? NO_ROWS

    // Celebrazione attiva: parametro URL (anche legacy ?messa=), poi ultima scelta, poi la prima
    const urlParam = searchParams.get('c') || searchParams.get('celebrazione') || searchParams.get('messa')
    const activeCelebration = useMemo(() => {
        const fromUrl = urlParam && celebrations.find((c) => c.toLowerCase() === urlParam.toLowerCase())
        if (fromUrl) return fromUrl
        const saved = localStorage.getItem('active_celebration')
        if (saved && celebrations.includes(saved)) return saved
        return celebrations[0] || ''
    }, [urlParam, celebrations])

    const toggleLyrics = (keyId) => {
        setOpenLyrics((prev) => ({
            ...prev,
            [keyId]: !prev[keyId]
        }))
    }

    const handleSelectCelebration = (celeb) => {
        localStorage.setItem('active_celebration', celeb)
        setSearchParams({ c: celeb }, { replace: true })
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

    // Canti presenti in archivio, nell'ordine della celebrazione: servono alle frecce della pagina canto
    const queue = useMemo(
        () => matchedSchedule.filter((r) => r.song).map((r) => ({ id: r.song.id, moment: r.moment })),
        [matchedSchedule]
    )

    const handleShareSchedule = async () => {
        const titleText = [activeCelebration || 'Canti per la celebrazione', nomeParrocchia].filter(Boolean).join(' — ')

        const base = window.location.origin + window.location.pathname
        const shareUrl = `${base}#/celebrazioni/${slug}?c=${encodeURIComponent(activeCelebration)}`
        const shareText = `🎶 *${titleText}*\nEcco i canti scelti con testi e spartiti:\n${shareUrl}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: titleText,
                    text: `🎶 ${titleText}\nEcco i canti scelti con testi e spartiti:`,
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

    if (slugUrl !== slug || songsLoading || loadingSchedule) {
        return <p className="status-message">Caricamento dei canti per la celebrazione...</p>
    }

    if (errorSchedule) {
        return (
            <p className="status-message error">
                {errorSchedule} <Link to="/celebrazioni">Scegli la parrocchia</Link>
            </p>
        )
    }

    return (
        <section className="daily-page-container">
            <header className="daily-header">
                <h2>{nomeParrocchia || 'Celebrazioni'}</h2>
                <p className="daily-subtitle">
                    {celebrations.length <= 1 && activeCelebration ? `${activeCelebration} · ` : ''}
                    <Link to="/celebrazioni">Cambia parrocchia</Link>
                </p>
            </header>

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
                            {celeb}
                        </button>
                    ))}
                </div>
            )}

            <div className="daily-toolbar">
                <span className="count">
                    {matchedSchedule.length} {matchedSchedule.length === 1 ? 'canto' : 'canti'}
                </span>
                <button
                    type="button"
                    className="icon-btn"
                    aria-pressed={showTextSize}
                    aria-label="Dimensione del testo"
                    title="Dimensione del testo"
                    onClick={() => setShowTextSize((v) => !v)}
                >
                    <Icon name="text-size" />
                </button>
                {wakeLock.supported && (
                    <button
                        type="button"
                        className="icon-btn"
                        aria-pressed={wakeLock.active}
                        aria-label="Schermo sempre acceso"
                        title={wakeLock.active ? 'Schermo sempre acceso: attivo' : 'Schermo sempre acceso: spento'}
                        onClick={wakeLock.toggle}
                    >
                        <Icon name="screen-on" />
                    </button>
                )}
                <Link
                    to={`/celebrazioni/${slug}/modifica${activeCelebration ? `?c=${encodeURIComponent(activeCelebration)}` : ''}`}
                    className="btn"
                >
                    Modifica
                </Link>
                {matchedSchedule.length > 0 && (
                    <button
                        type="button"
                        className={`btn ${copied ? 'is-done' : ''}`}
                        onClick={handleShareSchedule}
                        title="Condividi i canti di questa celebrazione"
                    >
                        <Icon name={copied ? 'check' : 'share'} size={18} />
                        {copied ? 'Copiato' : 'Condividi'}
                    </button>
                )}
            </div>
            {showTextSize && <FontSizeControls fontSize={fontSize} setFontSize={setFontSize} />}

            {matchedSchedule.length === 0 ? (
                <div className="empty-schedule">
                    <p>Nessun canto programmato al momento per questa parrocchia.</p>
                </div>
            ) : (
                <div className="schedule-list">
                    {matchedSchedule.map((item) => {
                        if (!item.song) {
                            return (
                                <article key={item.keyId} className="timeline-item is-missing">
                                    <div className="timeline-toggle">
                                        <span className="timeline-text">
                                            <span className="rubric">{item.moment}</span>
                                            <span className="timeline-title">Canto {item.songId} non in archivio</span>
                                            {item.notes && <span className="timeline-author">{item.notes}</span>}
                                        </span>
                                    </div>
                                </article>
                            )
                        }

                        const isOpen = !!openLyrics[item.keyId]
                        const panelId = `testo-${item.keyId}`
                        const queueIndex = queue.findIndex((q) => q.id === item.song.id && q.moment === item.moment)

                        return (
                            <article key={item.keyId} className="timeline-item">
                                <button
                                    type="button"
                                    className="timeline-toggle"
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    onClick={() => toggleLyrics(item.keyId)}
                                >
                                    <span className="timeline-text">
                                        <span className="rubric">{item.moment}</span>
                                        <span className="timeline-title">{item.song.title}</span>
                                        {item.song.author && <span className="timeline-author">{item.song.author}</span>}
                                    </span>
                                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
                                </button>

                                {isOpen && (
                                    <div className="timeline-panel" id={panelId}>
                                        {item.notes && (
                                            <div className="timeline-notes">
                                                <strong>Note:</strong> {item.notes}
                                            </div>
                                        )}
                                        {item.song.lyrics ? (
                                            <SongLyrics rawLyrics={item.song.lyrics} fontSize={fontSize} />
                                        ) : (
                                            <p className="no-lyrics">Testo non ancora inserito per questo canto.</p>
                                        )}
                                        <div className="timeline-panel-actions">
                                            <Link
                                                to={`/song/${item.song.id}`}
                                                state={{
                                                    from: 'daily',
                                                    parrocchia: slug,
                                                    celebration: activeCelebration,
                                                    moment: item.moment,
                                                    queue,
                                                    index: queueIndex,
                                                }}
                                                className="btn btn-primary"
                                            >
                                                Apri canto e spartiti
                                            </Link>
                                            {item.song.youtube && (
                                                <a
                                                    href={item.song.youtube}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn"
                                                >
                                                    <Icon name="play" size={18} />
                                                    YouTube
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
