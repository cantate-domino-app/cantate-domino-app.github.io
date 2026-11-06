import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { useParrocchia } from '../context/ParrocchiaContext'
import { chiamaApi } from '../lib/api'

const VUOTO = { title: '', author: '', link: '', lyrics: '', notes: '', name: '' }

export default function SuggestPage() {
    const { dati } = useParrocchia()
    const [formData, setFormData] = useState({ ...VUOTO, parish: dati?.parrocchia?.nome || '' })

    const [status, setStatus] = useState({
        submitting: false,
        success: false,
        error: null
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            setStatus({ submitting: false, success: false, error: 'Il titolo del canto è obbligatorio.' })
            return
        }

        setStatus({ submitting: true, success: false, error: null })

        // Il "Grazie" arriva solo se lo script conferma di aver salvato la proposta
        const risposta = await chiamaApi('proponiCanto', {
            parrocchia: formData.parish,
            titolo: formData.title,
            autore: formData.author,
            link: formData.link,
            testo: formData.lyrics,
            note: formData.notes,
            nome: formData.name,
        })
        if (!risposta.ok) {
            setStatus({ submitting: false, success: false, error: risposta.errore })
            return
        }
        setStatus({ submitting: false, success: true, error: null })
        setFormData((prev) => ({ ...VUOTO, parish: prev.parish }))
    }

    return (
        <section className="suggest-page-container">
            <Link to="/" className="back-link">
                <Icon name="chevron-left" />
                <span>Archivio</span>
            </Link>

            <header className="suggest-header">
                <h2>Suggerisci un canto</h2>
                <p className="suggest-subtitle">
                    Proponi un brano per arricchire il repertorio del coro e le celebrazioni parrocchiali.
                </p>
            </header>

            {status.success ? (
                <div className="suggest-success-card">
                    <div className="success-icon"><Icon name="check" size={28} /></div>
                    <h3>Grazie per la proposta!</h3>
                    <p>La proposta è arrivata. Se viene accettata, il canto compare nell'archivio.</p>
                    <button
                        type="button"
                        className="btn btn-new-suggestion"
                        onClick={() => setStatus({ submitting: false, success: false, error: null })}
                    >
                        Suggerisci un altro canto
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="suggest-form">
                    {status.error && (
                        <div className="suggest-error-banner" role="alert">
                            {status.error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="title">
                            Titolo del canto <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="es. Frutto della nostra terra"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="author">Autore o gruppo <span className="optional">(facoltativo)</span></label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            placeholder="es. Buttazzo, RnS, Frisina..."
                            value={formData.author}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="link">Link YouTube o spartito <span className="optional">(facoltativo)</span></label>
                        <input
                            type="url"
                            id="link"
                            name="link"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={formData.link}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lyrics">Testo del canto <span className="optional">(facoltativo)</span></label>
                        <textarea
                            id="lyrics"
                            name="lyrics"
                            rows={6}
                            placeholder="Strofe separate da una riga vuota"
                            value={formData.lyrics}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Commento <span className="optional">(facoltativo)</span></label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder="es. Adatto per l'Offertorio nel tempo ordinario, strofe facili per l'assemblea..."
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="parish">Parrocchia <span className="optional">(facoltativo)</span></label>
                        <input
                            type="text"
                            id="parish"
                            name="parish"
                            placeholder="Da quale parrocchia arriva la proposta?"
                            value={formData.parish}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Il tuo nome <span className="optional">(facoltativo)</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Chi suggerisce il canto?"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={status.submitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary submit-suggestion-btn"
                        disabled={status.submitting}
                    >
                        {status.submitting ? 'Invio in corso...' : 'Invia Proposta'}
                    </button>
                </form>
            )}
        </section>
    )
}