import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { useTheme } from '../context/ThemeContext'
import IosInstallPrompt, { isIosDevice } from './IosInstallPrompt'
import Icon from './Icon'

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [installPrompt, setInstallPrompt] = useState(null)
    const [isIos, setIsIos] = useState(false)
    const [showIosGuide, setShowIosGuide] = useState(false)
    const location = useLocation()
    const { isAdmin, logout } = useAdmin()
    const { theme, toggleTheme } = useTheme()

    // Gestione installazione PWA (Chrome, Edge, Android + rilevamento iOS)
    useEffect(() => {
        setIsIos(isIosDevice())

        const handleBeforeInstall = (e) => {
            e.preventDefault()
            setInstallPrompt(e)
        }

        const handleAppInstalled = () => {
            setInstallPrompt(null)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!installPrompt) return
        installPrompt.prompt()
        const choice = await installPrompt.userChoice
        if (choice.outcome === 'accepted') {
            setInstallPrompt(null)
        }
    }

    const closeMenu = () => setMenuOpen(false)

    return (
        <>
            <header className="navbar">
                <div className="navbar-left">
                    <button
                        type="button"
                        className="icon-btn menu-button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Apri menu"
                        aria-expanded={menuOpen}
                    >
                        <Icon name="menu" />
                    </button>

                    <div className="navbar-titles">
                        <div className="navbar-title-row">
                            <h1>
                                <Link to="/">
                                    Canti Liturgici
                                </Link>
                            </h1>
                            {isAdmin && <span className="admin-active-badge">Admin</span>}
                        </div>
                        <span className="navbar-subtitle">
                            Archivio canti per cori e musicisti
                        </span>
                    </div>
                </div>

                <div className="navbar-right">
                    {installPrompt ? (
                        <button
                            type="button"
                            className="btn btn-primary install-navbar-btn"
                            onClick={handleInstallClick}
                            title="Installa l'app sul tuo dispositivo"
                        >
                            <Icon name="install" size={18} />
                            Installa
                        </button>
                    ) : isIos ? (
                        <button
                            type="button"
                            className="btn btn-primary install-navbar-btn"
                            onClick={() => setShowIosGuide(true)}
                            title="Installa l'app su iPhone"
                        >
                            <Icon name="install" size={18} />
                            Installa
                        </button>
                    ) : null}

                    {/* Toggle rapido tema Sole/Luna */}
                    <button
                        type="button"
                        className="icon-btn theme-toggle-btn"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
                        aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
                    >
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
                    </button>
                </div>
            </header>

            {menuOpen && <div className="backdrop" onClick={closeMenu} />}

            <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Menu">
                <div className="sidebar-header">
                    <h2>Menu</h2>
                    <button type="button" className="icon-btn close-button" onClick={closeMenu} aria-label="Chiudi menu">
                        <Icon name="close" />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <Link
                        to="/"
                        className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Tutti i Canti
                    </Link>
                    <Link
                        to="/celebrazioni"
                        className={`sidebar-link ${location.pathname.startsWith('/celebrazioni') ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Celebrazioni
                    </Link>
                    <Link
                        to="/suggest"
                        className={`sidebar-link ${location.pathname === '/suggest' ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        Suggerisci Canto
                    </Link>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className={`sidebar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            Area admin
                        </Link>
                    )}
                </nav>

                {installPrompt ? (
                    <div className="sidebar-install-row">
                        <button
                            type="button"
                            className="btn btn-primary install-sidebar-btn"
                            onClick={() => {
                                handleInstallClick()
                                closeMenu()
                            }}
                        >
                            <Icon name="install" size={18} />
                            Installa l'App
                        </button>
                    </div>
                ) : isIos ? (
                    <div className="sidebar-install-row">
                        <button
                            type="button"
                            className="btn btn-primary install-sidebar-btn"
                            onClick={() => {
                                setShowIosGuide(true)
                                closeMenu()
                            }}
                        >
                            <Icon name="install" size={18} />
                            Installa su iPhone
                        </button>
                    </div>
                ) : null}

                <div className="sidebar-theme-row">
                    <span>Aspetto</span>
                    <button type="button" className="btn theme-pill-btn" onClick={toggleTheme}>
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
                        {theme === 'dark' ? 'Chiaro' : 'Scuro'}
                    </button>
                </div>

                {isAdmin && (
                    <div className="sidebar-admin-footer">
                        <span className="admin-status-text">Modalità admin attiva</span>
                        <button
                            type="button"
                            className="btn admin-logout-btn"
                            onClick={() => {
                                logout()
                                closeMenu()
                            }}
                        >
                            Esci da Admin
                        </button>
                    </div>
                )}
            </aside>

            {/* Guida e suggerimento per installare su iPhone */}
            <IosInstallPrompt showModal={showIosGuide} onCloseModal={() => setShowIosGuide(false)} />
        </>
    )
}