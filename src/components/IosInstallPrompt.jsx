import { useState, useEffect } from 'react'

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

    return (
        <div className="ios-prompt-overlay" onClick={showModal ? onCloseModal : handleDismiss}>
            <div className="ios-prompt-card" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="ios-prompt-close"
                    onClick={showModal ? onCloseModal : handleDismiss}
                    aria-label="Chiudi guida installazione"
                >
                    ✕
                </button>

                <div className="ios-prompt-header">
                    <span className="ios-prompt-icon">📲</span>
                    <div>
                        <h3>Installa l'App su iPhone</h3>
                        <p className="ios-prompt-sub">Per aprirla a schermo intero e usarla offline in chiesa</p>
                    </div>
                </div>

                <div className="ios-prompt-steps">
                    <div className="ios-step">
                        <span className="ios-step-num">1</span>
                        <p>
                            In Safari, tocca il tasto <strong>Condividi</strong> nella barra in basso{' '}
                            <span className="ios-share-badge">
                                <svg width="14" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                    <polyline points="16 6 12 2 8 6"></polyline>
                                    <line x1="12" y1="2" x2="12" y2="15"></line>
                                </svg>
                            </span>
                        </p>
                    </div>

                    <div className="ios-step">
                        <span className="ios-step-num">2</span>
                        <p>
                            Scorri il menu e tocca <strong>«Aggiungi alla schermata Home»</strong> ➕
                        </p>
                    </div>

                    <div className="ios-step">
                        <span className="ios-step-num">3</span>
                        <p>
                            Conferma toccando <strong>«Aggiungi»</strong> in alto a destra. Troverai l'icona sul tuo schermo!
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="ios-prompt-btn"
                    onClick={showModal ? onCloseModal : handleDismiss}
                >
                    Ho capito
                </button>
            </div>
        </div>
    )
}
