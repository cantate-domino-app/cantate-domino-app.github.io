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

// Avvio istantaneo dalla copia in localStorage, poi aggiornamento silenzioso in background.
// L'errore viene esposto solo se non c'era nessuna copia da mostrare.
export function useCachedCsv(url, cacheKey, parse, isEmpty) {
    const [state, setState] = useState(() => {
        const cached = readCache(cacheKey, parse, isEmpty)
        return { data: cached, loading: !cached, error: null }
    })

    useEffect(() => {
        let isMounted = true
        const cachedCsv = localStorage.getItem(cacheKey)

        fetch(url)
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
                        setState({ data: parsed, loading: false, error: null })
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
    }, [url, cacheKey, parse, isEmpty])

    return state
}
