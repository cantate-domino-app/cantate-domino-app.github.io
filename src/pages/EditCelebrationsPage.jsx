import { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useParrocchia } from '../context/ParrocchiaContext'
import { useSongs } from '../context/SongsContext'
import SongPicker from '../components/SongPicker'
import Icon from '../components/Icon'

const MOMENTI = [
    'Ingresso', 'Atto penitenziale', 'Gloria', 'Salmo', 'Alleluia', 'Offertorio', 'Santo',
    'Padre nostro', 'Pace', 'Agnello di Dio', 'Comunione', 'Finale',
]
const NUOVA = '__nuova__'

let contatore = 0
const nuovaRiga = (r = {}) => ({ chiave: ++contatore, momento: r.momento || '', cantoId: r.cantoId || '', note: r.note || '' })

function righeDi(dati, celebrazione) {
    return (dati?.righe || [])
        .filter((r) => r.celebrazione === celebrazione)
        .sort((a, b) => a.ordine - b.ordine)
        .map(nuovaRiga)
}

function Accesso({ nome, sblocca }) {
    const [password, setPassword] = useState('')
    const [stato, setStato] = useState({ invio: false, errore: null })

    const invia = async (e) => {
        e.preventDefault()
        setStato({ invio: true, errore: null })
        const risposta = await sblocca(password)
        if (!risposta.ok) setStato({ invio: false, errore: risposta.errore })
    }

    return (
        <form className="suggest-form" onSubmit={invia}>
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
            <p>Per modificare le celebrazioni di {nome} serve la password del coro.</p>
            <div className="form-group">
                <label htmlFor="password-coro">Password del coro</label>
                <input
                    id="password-coro"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={stato.invio}
                />
            </div>
            <button type="submit" className="btn btn-primary" disabled={stato.invio}>
                {stato.invio ? 'Verifica in corso...' : 'Entra'}
            </button>
        </form>
    )
}

export default function EditCelebrationsPage() {
    const { slug: slugUrl } = useParams()
    const [searchParams] = useSearchParams()
    const { slug, scegli, dati, loading, sbloccata, sblocca, esci, scriviApi, aggiornaDati } = useParrocchia()
    const { loading: songsLoading } = useSongs()

    useEffect(() => {
        if (slugUrl && slugUrl !== slug) scegli(slugUrl)
    }, [slugUrl, slug, scegli])

    const celebrazioni = [...new Set((dati?.righe || []).map((r) => r.celebrazione))]
    const iniziale = searchParams.get('c')
    const [scelta, setScelta] = useState(null)
    const [nomeNuova, setNomeNuova] = useState('')
    const [righe, setRighe] = useState([])
    const [stato, setStato] = useState({ invio: false, errore: null, ok: null })

    // Prima apertura (e dopo un'eliminazione): la celebrazione del link, altrimenti la prima
    if (scelta === null && dati && slugUrl === slug) {
        const prima = celebrazioni.includes(iniziale) ? iniziale : celebrazioni[0] || NUOVA
        setScelta(prima)
        setRighe(prima === NUOVA ? [nuovaRiga()] : righeDi(dati, prima))
    }

    if (slugUrl !== slug || loading || songsLoading) return <p className="status-message">Caricamento...</p>
    if (!dati) return <p className="status-message error">Impossibile caricare la parrocchia.</p>

    const nome = dati.parrocchia.nome
    const nomeCelebrazione = scelta === NUOVA ? nomeNuova.trim() : scelta
    const indietro = `/celebrazioni/${slug}${scelta && scelta !== NUOVA ? `?c=${encodeURIComponent(scelta)}` : ''}`

    const cambiaCelebrazione = (valore) => {
        setScelta(valore)
        setNomeNuova('')
        setRighe(valore === NUOVA ? [nuovaRiga()] : righeDi(dati, valore))
        setStato({ invio: false, errore: null, ok: null })
    }

    const aggiorna = (i, campo, valore) => setRighe((rr) => rr.map((r, j) => (j === i ? { ...r, [campo]: valore } : r)))
    const sposta = (i, d) => setRighe((rr) => {
        const copia = [...rr]
        ;[copia[i], copia[i + d]] = [copia[i + d], copia[i]]
        return copia
    })

    const salva = async () => {
        if (!nomeCelebrazione) return setStato({ invio: false, ok: null, errore: 'Scrivi il nome della celebrazione.' })
        if (righe.some((r) => !r.momento.trim() || !r.cantoId)) {
            return setStato({ invio: false, ok: null, errore: 'Ogni riga deve avere il momento e il canto.' })
        }
        setStato({ invio: true, errore: null, ok: null })
        const daInviare = righe.map(({ momento, cantoId, note }) => ({ momento: momento.trim(), cantoId, note: note.trim() }))
        const risposta = await scriviApi('salvaCelebrazione', { celebrazione: nomeCelebrazione, righe: daInviare })
        if (!risposta.ok) return setStato({ invio: false, ok: null, errore: risposta.errore })
        const altre = dati.righe.filter((r) => r.celebrazione !== nomeCelebrazione)
        aggiornaDati({
            ...dati,
            righe: [...altre, ...daInviare.map((r, i) => ({ ...r, celebrazione: nomeCelebrazione, ordine: i + 1 }))],
        })
        setScelta(nomeCelebrazione)
        setStato({ invio: false, errore: null, ok: 'Salvato.' })
    }

    const elimina = async () => {
        if (!window.confirm(`Eliminare la celebrazione "${scelta}" e tutti i suoi canti?`)) return
        setStato({ invio: true, errore: null, ok: null })
        const risposta = await scriviApi('eliminaCelebrazione', { celebrazione: scelta })
        if (!risposta.ok) return setStato({ invio: false, ok: null, errore: risposta.errore })
        aggiornaDati({ ...dati, righe: dati.righe.filter((r) => r.celebrazione !== scelta) })
        setScelta(null)
        setStato({ invio: false, errore: null, ok: 'Celebrazione eliminata.' })
    }

    return (
        <section className="suggest-page-container">
            <Link to={indietro} className="back-link">
                <Icon name="chevron-left" />
                <span>{nome}</span>
            </Link>
            <header className="suggest-header">
                <h2>Modifica celebrazioni</h2>
                {sbloccata && (
                    <p className="suggest-subtitle">
                        {nome} · <button type="button" className="link-btn" onClick={esci}>Esci</button>
                    </p>
                )}
            </header>

            {!sbloccata ? (
                <Accesso nome={nome} sblocca={sblocca} />
            ) : (
                <div className="suggest-form">
                    {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
                    {stato.ok && <div className="form-ok" role="status">{stato.ok}</div>}

                    <div className="form-group">
                        <label htmlFor="celebrazione">Celebrazione</label>
                        <select id="celebrazione" value={scelta || NUOVA} onChange={(e) => cambiaCelebrazione(e.target.value)}>
                            {celebrazioni.map((c) => <option key={c} value={c}>{c}</option>)}
                            <option value={NUOVA}>Nuova celebrazione…</option>
                        </select>
                    </div>
                    {scelta === NUOVA && (
                        <div className="form-group">
                            <label htmlFor="nome-celebrazione">Nome della nuova celebrazione</label>
                            <input
                                id="nome-celebrazione"
                                type="text"
                                maxLength={60}
                                placeholder="es. Messa 18:00"
                                value={nomeNuova}
                                onChange={(e) => setNomeNuova(e.target.value)}
                            />
                        </div>
                    )}

                    <datalist id="momenti">
                        {MOMENTI.map((m) => <option key={m} value={m} />)}
                    </datalist>

                    <ol className="edit-rows">
                        {righe.map((r, i) => (
                            <li key={r.chiave} className="edit-row">
                                <div className="form-group">
                                    <label htmlFor={`momento-${r.chiave}`}>Momento</label>
                                    <input
                                        id={`momento-${r.chiave}`}
                                        type="text"
                                        list="momenti"
                                        maxLength={60}
                                        value={r.momento}
                                        onChange={(e) => aggiorna(i, 'momento', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`canto-${r.chiave}`}>Canto</label>
                                    <SongPicker id={`canto-${r.chiave}`} value={r.cantoId} onChange={(v) => aggiorna(i, 'cantoId', v)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor={`note-${r.chiave}`}>Note <span className="optional">(facoltative)</span></label>
                                    <input
                                        id={`note-${r.chiave}`}
                                        type="text"
                                        maxLength={200}
                                        value={r.note}
                                        onChange={(e) => aggiorna(i, 'note', e.target.value)}
                                    />
                                </div>
                                <div className="edit-row-actions">
                                    <button type="button" className="icon-btn" aria-label="Sposta su" disabled={i === 0} onClick={() => sposta(i, -1)}>
                                        <Icon name="chevron-up" />
                                    </button>
                                    <button type="button" className="icon-btn" aria-label="Sposta giù" disabled={i === righe.length - 1} onClick={() => sposta(i, 1)}>
                                        <Icon name="chevron-down" />
                                    </button>
                                    <button type="button" className="btn" onClick={() => setRighe((rr) => rr.filter((_, j) => j !== i))}>
                                        Rimuovi
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <button type="button" className="btn" onClick={() => setRighe((rr) => [...rr, nuovaRiga()])}>
                        <Icon name="plus" size={18} />
                        Aggiungi canto
                    </button>

                    <div className="edit-actions">
                        <button type="button" className="btn btn-primary" disabled={stato.invio} onClick={salva}>
                            {stato.invio ? 'Salvataggio...' : 'Salva'}
                        </button>
                        {scelta && scelta !== NUOVA && (
                            <button type="button" className="btn" disabled={stato.invio} onClick={elimina}>
                                Elimina celebrazione
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}
