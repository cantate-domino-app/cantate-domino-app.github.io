import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hymn_font_size'
export const FONT_MIN = 16
export const FONT_MAX = 36
const FONT_DEFAULT = 22

const clamp = (n) => Math.min(Math.max(n, FONT_MIN), FONT_MAX)

// Dimensione del testo condivisa tra pagina canto e celebrazioni
export function useFontSize() {
    const [fontSize, setRaw] = useState(() => {
        const saved = Number(localStorage.getItem(STORAGE_KEY))
        return saved ? clamp(saved) : FONT_DEFAULT
    })

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, fontSize)
    }, [fontSize])

    const setFontSize = useCallback((next) => {
        setRaw((prev) => clamp(typeof next === 'function' ? next(prev) : next))
    }, [])

    return [fontSize, setFontSize]
}
