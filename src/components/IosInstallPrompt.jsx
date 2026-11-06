import { useState, useEffect } from 'react'
import Icon from './Icon'

export function isIosDevice() {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isStandalone =
        ('standalone' in window.navigator && window.navigator.standalone) ||
        window.matchMedia('(display-mode: standalone)').matches
    return isIos && !isStandalone
}

export default function IosInstallPrompt({ showModal, onCloseModal }) {
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        if (!isIosDevice()) return
        const dismissed = localStorage.getItem('ios_install_prompt_dismissed')
        if (!dismissed) {
            // Piccolo delay per non apparire bruscamente all'avvio
            const timer = setTimeout(() => setShowBanner(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleDismiss = () => {
        setShowBanner(false)
        localStorage.setItem('ios_install_prompt_dismissed', 'true')
    }

    // Se né il banner automatico né il modal manuale sono attivi, non renderizzare nulla
    if (!showBanner && !showModal) return null

    const close = showModal ? onCloseModal : handleDismiss

    return (
        <div className="ios-prompt-overlay" onClick={close}>
            <div
                className="ios-prompt-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ios-prompt-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="icon-btn ios-prompt-close"
                    onClick={close}
                    aria-label="Chiudi guida installazione"
                >
                    <Icon name="close" />
                </button>

                <div className="ios-prompt-header">
                    <h3 id="ios-prompt-title">Installa l'app su iPhone</h3>
                    <p className="ios-prompt-sub">Per aprirla a schermo intero e usarla offline in chiesa</p>
                </div>

                <ol className="ios-prompt-steps">
                    <li className="ios-step">
                        <p>
                            In Safari, tocca il tasto <strong>Condividi</strong> nella barra in basso{' '}
                            <span className="ios-share-badge">
                                <Icon name="share" size={18} />
                            </span>
                        </p>
                    </li>
                    <li className="ios-step">
                        <p>
                            Scorri il menu e tocca <strong>«Aggiungi alla schermata Home»</strong>
                        </p>
                    </li>
                    <li className="ios-step">
                        <p>
                            Conferma toccando <strong>«Aggiungi»</strong> in alto a destra. Troverai l'icona sul tuo schermo!
                        </p>
                    </li>
                </ol>

                <button type="button" className="btn btn-primary ios-prompt-btn" onClick={close}>
                    Ho capito
                </button>
            </div>
        </div>
    )
}
