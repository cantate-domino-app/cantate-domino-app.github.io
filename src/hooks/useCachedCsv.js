import { useState, useEffect } from 'react'

function readCache(cacheKey, parse, isEmpty) {
    const cachedCsv = localStorage.getItem(cacheKey)
    if (!cachedCsv) return null
    try {
        const parsed = parse(cachedCsv)
        return isEmpty(parsed) ? null : parsed
    } catch (err) {
        console.warn('Errore lettura cache:', cacheKey, err)
        return null
    }
}

function initialState(url, cacheKey, parse, isEmpty, version) {
    const cached = url ? readCache(cacheKey, parse, isEmpty) : null
    return { key: `${cacheKey}#${version}`, data: cached, loading: !!url && !cached, error: null }
}

// Avvio istantaneo dalla copia in localStorage, poi aggiornamento silenzioso in background.
// L'errore viene esposto solo se non c'era nessuna copia da mostrare.
// url null = niente da caricare. Cambiare cacheKey o version riparte dalla copia in cache
// (version serve dopo aver scritto la cache a mano, per esempio dopo un salvataggio).
export function useCachedCsv(url, cacheKey, parse, isEmpty, version = 0) {
    const [state, setState] = useState(() => initialState(url, cacheKey, parse, isEmpty, version))
    let current = state
    if (state.key !== `${cacheKey}#${version}`) {
        current = initialState(url, cacheKey, parse, isEmpty, version)
        setState(current)
    }

    useEffect(() => {
        if (!url) return
        let isMounted = true
        const key = `${cacheKey}#${version}`
        const cachedCsv = localStorage.getItem(cacheKey)

        // GitHub Pages fa tenere il file in cache 10 minuti: no-cache lo fa ricontrollare a ogni apertura
        fetch(url, { cache: 'no-cache' })
            .then((res) => {
                if (!res.ok) throw new Error('Risposta di rete non valida')
                return res.text()
            })
            .then((freshCsv) => {
                if (!isMounted) return
                if (freshCsv && freshCsv !== cachedCsv) {
                    const parsed = parse(freshCsv)
                    if (!isEmpty(parsed)) {
                        localStorage.setItem(cacheKey, freshCsv)
                        setState({ key, data: parsed, loading: false, error: null })
                        return
                    }
                }
                setState((prev) => ({ ...prev, loading: false, error: null }))
            })
            .catch((err) => {
                if (!isMounted) return
                setState((prev) => {
                    if (!prev.data) console.error('Caricamento fallito:', url, err)
                    return { ...prev, loading: false, error: prev.data ? null : err.message }
                })
            })

        return () => {
            isMounted = false
        }
    }, [url, cacheKey, parse, isEmpty, version])

    return current
}
