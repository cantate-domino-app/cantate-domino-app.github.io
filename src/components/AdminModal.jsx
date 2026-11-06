import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import Icon from './Icon'

export default function AdminModal() {
    const { showLoginModal, setShowLoginModal, loginWithPin } = useAdmin()
    const [pin, setPin] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    if (!showLoginModal) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await loginWithPin(pin)
        if (!result.success) {
            setErrorMessage(result.error)
            setPin('')
        } else {
            setErrorMessage('')
            setPin('')
        }
    }

    const handleClose = () => {
        setErrorMessage('')
        setPin('')
        setShowLoginModal(false)
    }

    return (
        <div className="admin-modal-overlay" onClick={handleClose}>
            <div
                className="admin-modal-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="icon-btn admin-modal-close"
                    onClick={handleClose}
                    aria-label="Chiudi"
                >
                    <Icon name="close" />
                </button>

                <div className="admin-modal-header">
                    <h3 id="admin-modal-title">Sei Luca?</h3>
                    <p>Inserisci il PIN per visualizzare gli spartiti personali con le tue note.</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="••••"
                        aria-label="PIN"
                        value={pin}
                        onChange={(e) => {
                            setErrorMessage('')
                            setPin(e.target.value)
                        }}
                        autoFocus
                        className="admin-pin-input"
                    />

                    {errorMessage && <p className="admin-error-msg" role="alert">{errorMessage}</p>}

                    <div className="admin-modal-actions">
                        <button type="button" className="btn" onClick={handleClose}>
                            Annulla
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Sblocca
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
