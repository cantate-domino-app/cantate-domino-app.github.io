import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useSongs } from '../context/SongsContext'
import { useAdmin } from '../context/AdminContext'
import { useFontSize } from '../hooks/useFontSize'
import { useWakeLock } from '../hooks/useWakeLock'
import SongLyrics from '../components/SongLyrics'
import FontSizeControls from '../components/FontSizeControls'
import Icon from '../components/Icon'

const formatDriveUrl = (url, mode = 'preview') => {
    if (!url) return ''
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
        const fileId = match[1]
        return mode === 'preview'
            ? `https://drive.google.com/file/d/${fileId}/preview`
            : `https://drive.google.com/uc?export=download&id=${fileId}`
    }
    return url
}

// Spartito: niente anteprima finché non la si chiede (l'iframe di Drive è pesante)
function SheetRow({ label, url, title, isAdmin = false }) {
    const [showPreview, setShowPreview] = useState(false)
    const preview = formatDriveUrl(url, 'preview')

    return (
        <div className={`resource-row ${isAdmin ? 'is-admin' : ''}`}>
            <span className="resource-name">
                <Icon name={isAdmin ? 'lock' : 'music'} size={20} />
                {label}
            </span>
            <div className="resource-actions">
                <a href={preview} target="_blank" rel="noopener noreferrer" className="btn">
                    <Icon name="external" size={18} />
                    Apri
                </a>
                <a href={formatDriveUrl(url, 'download')} target="_blank" rel="noopener noreferrer" className="btn">
                    <Icon name="download" size={18} />
                    Scarica
                </a>
                <button
                    type="button"
                    className="btn"
                    aria-expanded={showPreview}
                    onClick={() => setShowPreview((v) => !v)}
                >
                    <Icon name={showPreview ? 'chevron-up' : 'chevron-down'} size={18} />
                    {showPreview ? 'Nascondi anteprima' : 'Anteprima'}
                </button>
            </div>
            {showPreview && (
                <iframe src={preview} title={`${label}: ${title}`} className="pdf-preview" loading="lazy" />
            )}
        </div>
    )
}

export default function SongPage() {
    const { id } = useParams()
    const location = useLocation()
    const { songs, loading, error } = useSongs()
    const { isAdmin } = useAdmin()

    // Provenienza: dalla celebrazione si torna alla stessa celebrazione
    const fromDaily = location.state?.from === 'daily' ? location.state : null
    const backTo = fromDaily?.celebration
        ? `/daily?celebrazione=${encodeURIComponent(fromDaily.celebration)}`
        : fromDaily ? '/daily' : '/'
    const backLabel = fromDaily ? fromDaily.celebration || 'Celebrazione' : 'Archivio'

    const [fontSize, setFontSize] = useFontSize()
    const [showTextSize, setShowTextSize] = useState(false)
    const wakeLock = useWakeLock()
    const [copied, setCopied] = useState(false)

    // Passando al canto successivo si riparte dall'inizio del testo
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

    const shareSong = async (title) => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({ title, url })
                return
            } catch (err) {
                if (err.name === 'AbortError') return
            }
        }
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Errore copia link:', err)
        }
    }

    if (loading) return <p className="status-message">Caricamento canto...</p>
    if (error) return <p className="status-message error">{error}</p>

    const song = songs.find((s) => s.id.toLowerCase() === id?.toLowerCase())

    if (!song) {
        return (
            <section className="song-detail-container">
                <div className="song-bar">
                    <Link to={backTo} className="back-link">
                        <Icon name="chevron-left" />
                        <span>{backLabel}</span>
                    </Link>
                </div>
                <p className="status-message">Canto non trovato nell'archivio.</p>
            </section>
        )
    }

    const rubric = fromDaily?.moment
        ? `${fromDaily.moment} · ${song.id}`
        : [...song.tags.slice(0, 2), song.id].join(' · ')
    const hasSheets = song.sheetOriginal || (isAdmin && song.sheetModified)

    // Frecce tra i canti della celebrazione (solo se si arriva da lì)
    const queue = fromDaily?.queue ?? []
    const index = fromDaily?.index ?? -1
    const hasStepper = index >= 0 && queue.length > 1
    const stepLink = (i) => ({
        to: `/song/${queue[i].id}`,
        state: { ...fromDaily, index: i, moment: queue[i].moment },
        replace: true,
    })
    const titleOf = (i) => songs.find((s) => s.id === queue[i].id)?.title ?? queue[i].id

    return (
        <article className={`song-detail-container ${hasStepper ? 'has-stepper' : ''}`}>
            <div className="song-bar">
                <Link to={backTo} className="back-link">
                    <Icon name="chevron-left" />
                    <span>{backLabel}</span>
                </Link>
                <div className="song-bar-actions">
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
                    <button
                        type="button"
                        className="icon-btn"
                        aria-label={copied ? 'Link copiato' : 'Condividi il canto'}
                        title="Condividi il canto"
                        onClick={() => shareSong(song.title)}
                    >
                        <Icon name={copied ? 'check' : 'share'} />
                    </button>
                </div>
            </div>
            {showTextSize && <FontSizeControls fontSize={fontSize} setFontSize={setFontSize} />}

            <header className="song-header">
                <div className="song-title-group">
                    <div className="rubric">{rubric}</div>
                    <h1>{song.title}</h1>
                    {song.author && <p className="song-subtitle">{song.author}</p>}
                    <p className={`song-binder ${song.binder ? '' : 'is-missing'}`}>
                        {song.binder ? `Nel raccoglitore: ${song.binder}` : 'Non nel raccoglitore'}
                    </p>
                </div>
            </header>

            <div className="song-body">
                {song.lyrics ? (
                    <SongLyrics rawLyrics={song.lyrics} fontSize={fontSize} />
                ) : (
                    <p className="no-lyrics">
                        Il testo di questo canto non è ancora stato inserito.
                        {(song.youtube || hasSheets) && ' Puoi ascoltarlo o aprire lo spartito qui sotto.'}
                    </p>
                )}

                {(hasSheets || song.youtube) && (
                    <section className="song-section" aria-labelledby="risorse-titolo">
                        <h2 id="risorse-titolo" className="rubric section-title">Spartiti e ascolto</h2>
                        {song.youtube && (
                            <div className="resource-row">
                                <span className="resource-name">
                                    <Icon name="play" size={20} />
                                    YouTube
                                </span>
                                <div className="resource-actions">
                                    <a
                                        href={song.youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={song.lyrics ? 'btn' : 'btn btn-primary'}
                                    >
                                        Ascolta
                                    </a>
                                </div>
                            </div>
                        )}
                        {song.sheetOriginal && (
                            <SheetRow label="Spartito originale" url={song.sheetOriginal} title={song.title} />
                        )}
                        {isAdmin && song.sheetModified && (
                            <SheetRow label="Spartito modificato" url={song.sheetModified} title={song.title} isAdmin />
                        )}
                    </section>
                )}

                {song.notes && (
                    <div className="notes-box">
                        <strong>Note</strong>
                        <p>{song.notes}</p>
                    </div>
                )}
            </div>

            {hasStepper && (
                <nav className="song-stepper" aria-label="Canti della celebrazione">
                    {index > 0 ? (
                        <Link {...stepLink(index - 1)} className="stepper-link prev">
                            <span className="rubric"><Icon name="chevron-left" size={14} />{queue[index - 1].moment}</span>
                            <span className="stepper-title">{titleOf(index - 1)}</span>
                        </Link>
                    ) : <span />}
                    <span className="stepper-pos">{index + 1} / {queue.length}</span>
                    {index < queue.length - 1 ? (
                        <Link {...stepLink(index + 1)} className="stepper-link next">
                            <span className="rubric">{queue[index + 1].moment}<Icon name="chevron-right" size={14} /></span>
                            <span className="stepper-title">{titleOf(index + 1)}</span>
                        </Link>
                    ) : <span />}
                </nav>
            )}
        </article>
    )
}
