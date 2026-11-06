import { normalizeText } from './search.js'

// I tag del foglio mescolano momenti della messa e tempi liturgici: questi sono i tempi.
// Tutto ciò che non è in elenco (anche un tag nuovo) viene trattato come momento.
export const TEMPI_LITURGICI = [
    'avvento', 'natale', 'quaresima', 'palme', 'giovedì santo', 'venerdì santo',
    'pasqua', 'pentecoste', 'spirito santo', 'ognissanti', 'mariano', 'san francesco',
]

const TEMPI_NORMALIZZATI = new Set(TEMPI_LITURGICI.map(normalizeText))

export const isTempo = (tag) => TEMPI_NORMALIZZATI.has(normalizeText(tag))

export function splitTags(tags) {
    return {
        momenti: tags.filter((t) => !isTempo(t)),
        tempi: tags.filter(isTempo),
    }
}
