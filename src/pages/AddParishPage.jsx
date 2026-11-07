import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { chiamaApi } from '../lib/api'

const VUOTO = { nome: '', citta: '', referente: '', contatto: '', note: '' }

export default function AddParishPage() {
    const [dati, setDati] = useState(VUOTO)
    const [stato, setStato] = useState({ invio: false, inviata: false, errore: null })
    const cambia = (e) => setDati((d) => ({ ...d, [e.target.name]: e.target.value }))

    const invia = async (e) => {
        e.preventDefault()
        setStato({ invio: true, inviata: false, errore: null })
        const risposta = await chiamaApi('richiediParrocchia', dati)
        if (!risposta.ok) return setStato({ invio: false, inviata: false, errore: risposta.errore })
        setDati(VUOTO)
        setStato({ invio: false, inviata: true, errore: null })
    }

    return (
        <section className="suggest-page-container">
            <Link to="/celebrazioni" className="back-link">
                <Icon name="chevron-left" />
                <span>Parrocchie</span>
            </Link>

            <header className="suggest-header">
                <h2>Aggiungi la tua parrocchia</h2>
                <p className="suggest-subtitle">
                    L'archivio dei canti è di tutti. Ogni parrocchia può avere le sue celebrazioni,
                    preparate dal proprio coro. È gratuito e senza pubblicità.
                </p>
            </header>

            <div className="guide">
                <h3 className="admin-sezione">Cosa avrà la tua parrocchia</h3>
                <ul className="guide-list">
                    <li>Una pagina con i canti di ogni celebrazione (Messa delle 10:30, Adorazione…), con testi e spartiti, da condividere su WhatsApp.</li>
                    <li>Una password per il coro: solo chi la conosce può modificare le celebrazioni. Tutti gli altri le leggono senza login.</li>
                    <li>Il proprio raccoglitore: si segna quali canti avete stampato e con quale numero, come nel raccoglitore di carta.</li>
                    <li>I canti che mancano si possono proporre dalla pagina "Suggerisci canto": una volta accettati, sono disponibili per tutte le parrocchie.</li>
                </ul>

                <h3 className="admin-sezione">Come si fa</h3>
                <ol className="guide-list">
                    <li>Compila il modulo qui sotto.</li>
                    <li>Ti contattiamo e creiamo la parrocchia.</li>
                    <li>Ricevi la password del coro: condividila con chi prepara i canti.</li>
                    <li>
                        Da <strong>Celebrazioni</strong> scegli la tua parrocchia e premi <strong>Modifica</strong>:
                        dai un nome alla celebrazione e aggiungi i canti momento per momento.
                    </li>
                </ol>
            </div>

            <h3 className="admin-sezione">Richiesta</h3>
            {stato.inviata ? (
                <div className="suggest-success-card">
                    <div className="success-icon"><Icon name="check" size={28} /></div>
                    <h3>Richiesta inviata</h3>
                    <p>Ti contatteremo al recapito che hai lasciato.</p>
                    <Link to="/celebrazioni" className="btn">Torna alle parrocchie</Link>
                </div>
            ) : (
                <form className="suggest-form" onSubmit={invia}>
                    {stato.errore && <div className="suggest-error-banner" role="alert">{stato.errore}</div>}
                    <div className="form-group">
                        <label htmlFor="nome">Nome della parrocchia <span className="required">*</span></label>
                        <input id="nome" name="nome" type="text" maxLength={80} required placeholder="es. San Nicolò" value={dati.nome} onChange={cambia} disabled={stato.invio} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="citta">Città <span className="optional">(facoltativa)</span></label>
                        <input id="citta" name="citta" type="text" maxLength={80} value={dati.citta} onChange={cambia} disabled={stato.invio} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="referente">Il tuo nome <span className="optional">(facoltativo)</span></label>
                        <input id="referente" name="referente" type="text" maxLength={80} placeholder="Chi segue il coro?" value={dati.referente} onChange={cambia} disabled={stato.invio} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contatto">Email o telefono <span className="required">*</span></label>
                        <input id="contatto" name="contatto" type="text" maxLength={120} required autoComplete="email" value={dati.contatto} onChange={cambia} disabled={stato.invio} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="note">Note <span className="optional">(facoltative)</span></label>
                        <textarea id="note" name="note" rows={3} maxLength={1000} value={dati.note} onChange={cambia} disabled={stato.invio} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={stato.invio}>
                        {stato.invio ? 'Invio in corso...' : 'Invia la richiesta'}
                    </button>
                </form>
            )}
        </section>
    )
}
