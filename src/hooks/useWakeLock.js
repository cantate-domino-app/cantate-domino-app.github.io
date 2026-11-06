import { useState, useEffect, useRef, useCallback } from 'react'

// Schermo sempre acceso: attivo da solo, riattivato quando si torna sull'app
// (il browser lo rilascia ogni volta che la pagina viene nascosta).
export function useWakeLock({ auto = true } = {}) {
    const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
    const [wanted, setWanted] = useState(auto && supported)
    const [active, setActive] = useState(false)
    const lockRef = useRef(null)

    useEffect(() => {
        if (!wanted) return
        let cancelled = false

        const acquire = async () => {
            if (document.visibilityState !== 'visible' || lockRef.current) return
            try {
                const lock = await navigator.wakeLock.request('screen')
                if (cancelled) {
                    lock.release().catch(() => { })
                    return
                }
                lockRef.current = lock
                setActive(true)
                lock.addEventListener('release', () => {
                    lockRef.current = null
                    setActive(false)
                })
            } catch (err) {
                console.warn('Errore Wake Lock:', err)
                setActive(false)
            }
        }

        acquire()
        document.addEventListener('visibilitychange', acquire)

        return () => {
            cancelled = true
            document.removeEventListener('visibilitychange', acquire)
            lockRef.current?.release().catch(() => { })
            lockRef.current = null
        }
    }, [wanted])

    const toggle = useCallback(async () => {
        setWanted((prev) => !prev)
    }, [])

    return { supported, active, toggle }
}
