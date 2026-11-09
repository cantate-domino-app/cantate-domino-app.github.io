import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useCachedCsv } from '../hooks/useCachedCsv'
import { urlLettura, chiamaApi } from '../lib/api'

const CHIAVE_ATTIVA = 'parrocchia_attiva'
const chiaveCache = (slug) => `cached_celebrazioni_${slug}`
const chiavePassword = (slug) => `password_${slug}`
const PASSWORD_SCADUTA = 'La password del coro non è più valida: le modifiche NON sono state salvate. Inserisci la password e salva di nuovo.'

function leggiStorage(chiave) {
    try {
        return localStorage.getItem(chiave) || null
    } catch {
        return null
    }
}

function parseCelebrazioni(testo) {
    const dati = JSON.parse(testo)
    if (!dati.ok || !dati.parrocchia) throw new Error(dati.errore || 'Risposta non valida')
    return { parrocchia: dati.parrocchia, righe: dati.righe || [], raccoglitore: dati.raccoglitore || [] }
}

// Una parrocchia senza celebrazioni è un dato valido, non una cache vuota
const maiVuoto = () => false
const NESSUN_RIFERIMENTO = new Map()

const ParrocchiaContext = createContext()

export function ParrocchiaProvider({ children }) {
    const [slug, setSlug] = useState(() => leggiStorage(CHIAVE_ATTIVA))
    // Password del coro, ricordata su questo dispositivo dopo la verifica sul server
    const [password, setPassword] = useState(() => leggiStorage(chiavePassword(slug)))
    const [versione, setVersione] = useState(0)
    const url = slug ? urlLettura('celebrazioni', { parrocchia: slug }) : null
    const { data, loading, error } = useCachedCsv(url, chiaveCache(slug), parseCelebrazioni, maiVuoto, versione)

    const scegli = useCallback((nuovo) => {
        localStorage.setItem(CHIAVE_ATTIVA, nuovo)
        setSlug(nuovo)
        setPassword(leggiStorage(chiavePassword(nuovo)))
    }, [])

    const sblocca = useCallback(async (tentativo) => {
        const risposta = await chiamaApi('verificaParrocchia', { parrocchia: slug, password: tentativo })
        if (risposta.ok) {
            localStorage.setItem(chiavePassword(slug), tentativo)
            setPassword(tentativo)
        }
        return risposta
    }, [slug])

    const esci = useCallback(() => {
        localStorage.removeItem(chiavePassword(slug))
        setPassword(null)
    }, [slug])

// Scrittura con la password della parrocchia; se il server la rifiuta, si richiede
    const scriviApi = useCallback(async (azione, dati) => {
        const risposta = await chiamaApi(azione, { parrocchia: slug, password, ...dati })
        if (!risposta.ok && risposta.errore === 'Parrocchia o password non corretti.') {
            esci()
            return { ok: false, errore: PASSWORD_SCADUTA }
        }
        return risposta
    }, [slug, password, esci])

    // Dopo un salvataggio riuscito: mostra subito i dati nuovi, poi li riconferma dal server
    const aggiornaDati = useCallback((nuovi) => {
        localStorage.setItem(chiaveCache(slug), JSON.stringify({ ok: true, ...nuovi }))
        setVersione((v) => v + 1)
    }, [slug])

    // Canto_ID (maiuscolo) → riferimento nel raccoglitore di questa parrocchia
    const riferimenti = useMemo(() => {
        if (!data) return NESSUN_RIFERIMENTO
        return new Map(data.raccoglitore.map((r) => [r.cantoId.trim().toUpperCase(), r.riferimento]))
    }, [data])

    const valore = {
        slug,
        scegli,
        dati: data,
        loading,
        error: error ? 'Impossibile caricare le celebrazioni della parrocchia.' : null,
        aggiornaDati,
        riferimenti,
        sbloccata: !!password,
        sblocca,
        esci,
        scriviApi,
    }

    return <ParrocchiaContext.Provider value={valore}>{children}</ParrocchiaContext.Provider>
}

export function useParrocchia() {
    return useContext(ParrocchiaContext)
}

// Raccoglitore della parrocchia attiva. conCanti = false se non c'è parrocchia o il raccoglitore è vuoto;
// modificabile = c'è la password del coro
export function useRaccoglitore() {
    const { dati, riferimenti, sbloccata } = useParrocchia()
    return useMemo(() => ({
        conCanti: riferimenti.size > 0,
        modificabile: !!dati && sbloccata,
        nome: dati?.parrocchia?.nome || '',
        riferimento: (songId) => riferimenti.get(songId.toUpperCase()) || '',
    }), [dati, riferimenti, sbloccata])
}
