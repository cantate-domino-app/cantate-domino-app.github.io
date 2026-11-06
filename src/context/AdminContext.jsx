import { createContext, useContext, useState, useCallback } from 'react'
import { chiamaApi } from '../lib/api'

const AdminContext = createContext()
// sessionStorage: la password admin si dimentica alla chiusura della scheda
const CHIAVE = 'admin_password'

function leggiPassword() {
    try {
        return sessionStorage.getItem(CHIAVE)
    } catch {
        return null
    }
}

export function AdminProvider({ children }) {
    const [password, setPassword] = useState(leggiPassword)

    const logout = useCallback(() => {
        sessionStorage.removeItem(CHIAVE)
        setPassword(null)
    }, [])

    // La password è verificata dallo script: elencoProposte risponde solo all'admin
    const accedi = useCallback(async (tentativo) => {
        const risposta = await chiamaApi('elencoProposte', { adminPassword: tentativo })
        if (risposta.ok) {
            sessionStorage.setItem(CHIAVE, tentativo)
            setPassword(tentativo)
        }
        return risposta
    }, [])

    const chiamaAdmin = useCallback(async (azione, dati = {}) => {
        const risposta = await chiamaApi(azione, { adminPassword: password, ...dati })
        if (!risposta.ok && risposta.errore === 'Password admin non corretta.') logout()
        return risposta
    }, [password, logout])

    return (
        <AdminContext.Provider value={{ isAdmin: !!password, accedi, chiamaAdmin, logout }}>
            {children}
        </AdminContext.Provider>
    )
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (!context) {
        throw new Error('useAdmin deve essere usato all\'interno di un AdminProvider')
    }
    return context
}
