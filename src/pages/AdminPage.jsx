import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '../context/AdminContext'
import { leggiApi } from '../lib/api'

function Accesso({ accedi }) {
    const [password, setPassword] = useState('')
    const [stato, setStato] = useState({ invio: false, errore: null })

    const invia = async (e) => {
        e.preventDefault()
        setStato({ invio: true, errore: null })
        const risposta = await accedi(password)
        if (!risposta.ok) setStato({ invio: false, errore: risposta.errore })
    }

    return (
        <form className="suggest-form" onSubmit={invia}>
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
            <div className="form-group">
                <label htmlFor="password-admin">Password admin</label>
                <input
                    id="password-admin"
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

function Proposta({ proposta, chiamaAdmin, onFatto }) {
    const [tag, setTag] = useState('')
    const [modifiche, setModifiche] = useState({
        titolo: proposta.titolo || '',
        autore: proposta.autore || '',
        link: proposta.link || '',
        spartito: '',
        testo: proposta.testo || '',
        note: proposta.note || '',
    })
    const [stato, setStato] = useState({ invio: false, errore: null })
    const cambia = (e) => setModifiche((m) => ({ ...m, [e.target.name]: e.target.value }))

    const esegui = async (azione, dati) => {
        setStato({ invio: true, errore: null })
        const risposta = await chiamaAdmin(azione, { id: proposta.id, ...dati })
        if (!risposta.ok) return setStato({ invio: false, errore: risposta.errore })
        onFatto(azione === 'accettaProposta'
            ? `"${proposta.titolo}" accettato. ${risposta.pubblicato ? 'Sarà online tra un paio di minuti.' : 'Sarà online entro qualche ora: la pubblicazione immediata non è riuscita.'}`
            : `"${proposta.titolo}" rifiutato.`)
    }

    return (
        <li className="edit-row">
            <div>
                <h4 className="admin-proposta-titolo">{proposta.titolo}</h4>
                <p className="song-row-author">
                    Proposto da: {[proposta.parrocchia, proposta.nome].filter(Boolean).join(' · ') || 'anonimo'}
                </p>
                {proposta.link && <p><a href={proposta.link} target="_blank" rel="noopener noreferrer">Apri il link proposto</a></p>}
            </div>
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
            <div className="form-group">
                <label htmlFor={`titolo-${proposta.id}`}>Titolo</label>
                <input id={`titolo-${proposta.id}`} name="titolo" type="text" maxLength={150} value={modifiche.titolo} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`autore-${proposta.id}`}>Autori</label>
                <input id={`autore-${proposta.id}`} name="autore" type="text" maxLength={150} value={modifiche.autore} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`link-${proposta.id}`}>Link (YouTube o altro)</label>
                <input id={`link-${proposta.id}`} name="link" type="text" maxLength={500} value={modifiche.link} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`spartito-${proposta.id}`}>Spartito <span className="optional">(link Drive, facoltativo)</span></label>
                <input id={`spartito-${proposta.id}`} name="spartito" type="text" maxLength={500} value={modifiche.spartito} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`testo-${proposta.id}`}>Testo</label>
                <textarea id={`testo-${proposta.id}`} name="testo" rows={8} maxLength={10000} value={modifiche.testo} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`note-${proposta.id}`}>Note</label>
                <textarea id={`note-${proposta.id}`} name="note" rows={3} maxLength={1000} value={modifiche.note} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor={`tag-${proposta.id}`}>Tag <span className="optional">(facoltativi, separati da virgola)</span></label>
                <input id={`tag-${proposta.id}`} type="text" placeholder="es. comunione, quaresima" value={tag} onChange={(e) => setTag(e.target.value)} />
            </div>
            <div className="edit-actions">
                <button type="button" className="btn btn-primary" disabled={stato.invio} onClick={() => esegui('accettaProposta', { tag, modifiche })}>
                    Accetta
                </button>
                <button type="button" className="btn" disabled={stato.invio} onClick={() => esegui('rifiutaProposta')}>
                    Rifiuta
                </button>
            </div>
        </li>
    )
}

function Richiesta({ richiesta, chiamaAdmin, onUsa, onFatto }) {
    const [stato, setStato] = useState({ invio: false, errore: null })

    const gestita = async () => {
        setStato({ invio: true, errore: null })
        const risposta = await chiamaAdmin('chiudiRichiesta', { id: richiesta.id })
        if (!risposta.ok) return setStato({ invio: false, errore: risposta.errore })
        onFatto(`Richiesta di ${richiesta.nome} segnata come gestita.`)
    }

    return (
        <li className="edit-row">
            <div>
                <h4 className="admin-proposta-titolo">{richiesta.nome}</h4>
                <p className="song-row-author">{[richiesta.citta, richiesta.referente].filter(Boolean).join(' · ')}</p>
                <p><strong>Contatto:</strong> {richiesta.contatto}</p>
                {richiesta.note && <p>{richiesta.note}</p>}
            </div>
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
            <div className="edit-actions">
                <button type="button" className="btn btn-primary" onClick={() => onUsa(richiesta)}>Usa per nuova parrocchia</button>
                <button type="button" className="btn" disabled={stato.invio} onClick={gestita}>Segna come gestita</button>
            </div>
        </li>
    )
}

function NuovaParrocchia({ chiamaAdmin, onFatto, iniziale }) {
    const [dati, setDati] = useState({ nome: iniziale?.nome || '', citta: iniziale?.citta || '', password: '' })
    const [stato, setStato] = useState({ invio: false, errore: null })
    const cambia = (e) => setDati((d) => ({ ...d, [e.target.name]: e.target.value }))

    const invia = async (e) => {
        e.preventDefault()
        setStato({ invio: true, errore: null })
        const risposta = await chiamaAdmin('creaParrocchia', dati)
        if (!risposta.ok) return setStato({ invio: false, errore: risposta.errore })
        setDati({ nome: '', citta: '', password: '' })
        setStato({ invio: false, errore: null })
        onFatto(`Parrocchia "${risposta.parrocchia.nome}" creata. Comunica la password al coro.`)
    }

    return (
        <form className="suggest-form" onSubmit={invia}>
            <h3 className="admin-sezione">Nuova parrocchia</h3>
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
            <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input id="nome" name="nome" type="text" maxLength={80} required value={dati.nome} onChange={cambia} placeholder="es. San Nicolò" />
            </div>
            <div className="form-group">
                <label htmlFor="citta">Città <span className="optional">(facoltativa)</span></label>
                <input id="citta" name="citta" type="text" maxLength={80} value={dati.citta} onChange={cambia} />
            </div>
            <div className="form-group">
                <label htmlFor="password-nuova">Password del coro <span className="optional">(almeno 6 caratteri)</span></label>
                <input id="password-nuova" name="password" type="text" autoComplete="off" minLength={6} required value={dati.password} onChange={cambia} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={stato.invio}>Crea parrocchia</button>
        </form>
    )
}

function Parrocchia({ parrocchia, chiamaAdmin, onFatto }) {
    const [aperto, setAperto] = useState(false)
    const [password, setPassword] = useState('')
    const [stato, setStato] = useState({ invio: false, errore: null })

    const invia = async (e) => {
        e.preventDefault()
        setStato({ invio: true, errore: null })
        const risposta = await chiamaAdmin('impostaPassword', { parrocchia: parrocchia.slug, password })
        if (!risposta.ok) return setStato({ invio: false, errore: risposta.errore })
        setPassword('')
        setAperto(false)
        setStato({ invio: false, errore: null })
        onFatto(`Nuova password impostata per ${parrocchia.nome}.`)
    }

    return (
        <li className="edit-row">
            <div className="admin-parrocchia">
                <span>
                    <span className="song-row-title">{parrocchia.nome}</span>
                    {parrocchia.citta && <span className="song-row-author">{parrocchia.citta}</span>}
                </span>
                <button type="button" className="btn" onClick={() => setAperto((v) => !v)}>Reimposta password</button>
            </div>
            {aperto && (
                <form className="binder-form" onSubmit={invia}>
                    <label htmlFor={`pw-${parrocchia.slug}`}>Nuova password</label>
                    <input id={`pw-${parrocchia.slug}`} type="text" autoComplete="off" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={stato.invio}>Salva</button>
                </form>
            )}
            {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
        </li>
    )
}

export default function AdminPage() {
    const { isAdmin, accedi, chiamaAdmin, logout } = useAdmin()
    const [proposte, setProposte] = useState(null)
    const [richieste, setRichieste] = useState([])
    // Dati di una richiesta copiati nel modulo "Nuova parrocchia"
    const [daRichiesta, setDaRichiesta] = useState(null)
    const [parrocchie, setParrocchie] = useState(null)
    const [errore, setErrore] = useState(null)
    const [messaggio, setMessaggio] = useState(null)

    const carica = useCallback(async () => {
        const risposta = await chiamaAdmin('elencoProposte')
        if (!risposta.ok) return setErrore(risposta.errore)
        setErrore(null)
        setProposte(risposta.proposte)
        setRichieste(risposta.richieste || [])
        try {
            setParrocchie((await leggiApi('parrocchie')).parrocchie)
        } catch (err) {
            setErrore(err.message)
        }
    }, [chiamaAdmin])

    useEffect(() => {
        if (isAdmin) carica()
    }, [isAdmin, carica])

    const usaRichiesta = (richiesta) => {
        setDaRichiesta(richiesta)
        requestAnimationFrame(() => document.getElementById('nuova-parrocchia')?.scrollIntoView({ behavior: 'smooth' }))
    }

    const fatto = (testo) => {
        setMessaggio(testo)
        carica()
    }

    return (
        <section className="suggest-page-container">
            <header className="suggest-header">
                <h2>Area admin</h2>
                {isAdmin && (
                    <p className="suggest-subtitle">
                        <button type="button" className="link-btn" onClick={logout}>Esci</button>
                    </p>
                )}
            </header>

            {!isAdmin ? (
                <Accesso accedi={accedi} />
            ) : (
                <>
                    {errore && <div className="suggest-error-banner" role="alert">{errore}</div>}
                    {messaggio && <div className="form-ok" role="status">{messaggio}</div>}

                    {richieste.length > 0 && (
                        <>
                            <h3 className="admin-sezione">Richieste di nuove parrocchie</h3>
                            <ul className="edit-rows">
                                {richieste.map((r) => (
                                    <Richiesta key={r.id} richiesta={r} chiamaAdmin={chiamaAdmin} onUsa={usaRichiesta} onFatto={fatto} />
                                ))}
                            </ul>
                        </>
                    )}

                    <h3 className="admin-sezione">Proposte nuove</h3>
                    {proposte === null ? (
                        <p className="status-message">Caricamento...</p>
                    ) : proposte.length === 0 ? (
                        <p>Nessuna proposta da valutare.</p>
                    ) : (
                        <ul className="edit-rows">
                            {proposte.map((p) => <Proposta key={p.id} proposta={p} chiamaAdmin={chiamaAdmin} onFatto={fatto} />)}
                        </ul>
                    )}

                    <h3 className="admin-sezione">Parrocchie</h3>
                    {parrocchie && (
                        <ul className="edit-rows">
                            {parrocchie.map((p) => <Parrocchia key={p.slug} parrocchia={p} chiamaAdmin={chiamaAdmin} onFatto={fatto} />)}
                        </ul>
                    )}
                    <div id="nuova-parrocchia">
                        <NuovaParrocchia
                            key={daRichiesta?.id || 'vuota'}
                            iniziale={daRichiesta}
                            chiamaAdmin={chiamaAdmin}
                            onFatto={fatto}
                        />
                    </div>
                </>
            )}
        </section>
    )
}
