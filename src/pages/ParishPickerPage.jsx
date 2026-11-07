import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCachedCsv } from '../hooks/useCachedCsv'
import { useParrocchia } from '../context/ParrocchiaContext'
import { urlLettura } from '../lib/api'
import { normalizeText } from '../lib/search'
import Icon from '../components/Icon'

function parseParrocchie(testo) {
    const dati = JSON.parse(testo)
    if (!dati.ok) throw new Error(dati.errore || 'Risposta non valida')
    return dati.parrocchie
}
const isEmpty = (elenco) => elenco.length === 0
const URL_PARROCCHIE = urlLettura('parrocchie')

export default function ParishPickerPage() {
    const { data: parrocchie, loading, error } = useCachedCsv(URL_PARROCCHIE, 'cached_parrocchie', parseParrocchie, isEmpty)
    const { slug: attiva, scegli } = useParrocchia()
    const navigate = useNavigate()
    const [cerca, setCerca] = useState('')

    const trovate = useMemo(() => {
        const q = normalizeText(cerca)
        return (parrocchie || []).filter((p) => normalizeText(`${p.nome} ${p.citta}`).includes(q))
    }, [parrocchie, cerca])

    if (loading) return <p className="status-message">Caricamento delle parrocchie...</p>
    if (error) return <p className="status-message error">Impossibile caricare l'elenco delle parrocchie.</p>

    const apri = (slug) => {
        scegli(slug)
        navigate(`/celebrazioni/${slug}`)
    }

    return (
        <section className="suggest-page-container">
            <header className="suggest-header">
                <h2>Scegli la parrocchia</h2>
                <p className="suggest-subtitle">Le celebrazioni sono preparate dal coro di ogni parrocchia.</p>
            </header>

            <Link to="/aggiungi-parrocchia" className="parish-add-link">
                <Icon name="plus" size={20} />
                <span>Scopri come aggiungere la tua parrocchia</span>
                <Icon name="chevron-right" size={20} />
            </Link>

            <div className="search-bar-wrapper">
                <Icon name="search" />
                <input
                    type="search"
                    className="main-search-input"
                    placeholder="Nome della parrocchia o città"
                    aria-label="Cerca una parrocchia"
                    value={cerca}
                    onChange={(e) => setCerca(e.target.value)}
                />
            </div>

            <div className="songs-list">
                {trovate.map((p) => (
                    <article key={p.slug} className="song-row">
                        <button type="button" className="song-row-main parish-row" onClick={() => apri(p.slug)}>
                            <span>
                                <span className="song-row-title">{p.nome}</span>
                                {p.citta && <span className="song-row-author">{p.citta}</span>}
                            </span>
                            {p.slug === attiva && <span className="song-row-binder">Scelta ora</span>}
                        </button>
                    </article>
                ))}
            </div>
            {trovate.length === 0 && (
                <p className="status-message">
                    Nessuna parrocchia trovata. <Link to="/aggiungi-parrocchia">Scopri come aggiungere la tua</Link>.
                </p>
            )}
        </section>
    )
}
