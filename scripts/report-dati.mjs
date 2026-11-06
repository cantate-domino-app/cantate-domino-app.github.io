// Report sulla qualità dei dati del catalogo (Fase 2: pulizia dati).
// Uso: node scripts/report-dati.mjs [percorso/canti.json] > docs/universale/report-dati.md
import { readFileSync } from 'node:fs'
import { TEMPI_LITURGICI } from '../src/lib/tags.js'
import { normalizeText } from '../src/lib/search.js'

const MOMENTI_NOTI = [
    'ingresso', 'aspersione', 'perdono', 'atto penitenziale', 'gloria', 'salmo', 'alleluia', 'offertorio',
    'santo', 'padre nostro', 'pace', 'agnello di dio', 'comunione', 'adorazione', 'finale',
]
const VOCABOLARIO = new Set([...MOMENTI_NOTI, ...TEMPI_LITURGICI].map(normalizeText))

const percorso = process.argv[2] || new URL('../public/canti.json', import.meta.url)
const canti = JSON.parse(readFileSync(percorso, 'utf8')).canti.filter((c) => (c.Titolo || '').trim())

const nome = (c) => `${c.ID} — ${c.Titolo.trim()}`
const elenco = (righe) => (righe.length ? righe.map((r) => `- ${r}`).join('\n') : '_Nessuno._')

const senzaTesto = canti.filter((c) => !(c.Testo || '').trim())

const ritornelliMaiuscoli = canti.filter((c) =>
    [...(c.Testo || '').matchAll(/<RIT>([\s\S]*?)<\/?RIT\/?>/gi)].some(([, rit]) => {
        const lettere = rit.replace(/[^A-Za-zÀ-ÿ]/g, '')
        return lettere.length > 10 && lettere === lettere.toUpperCase()
    })
)

const perTitolo = new Map()
canti.forEach((c) => {
    const chiave = normalizeText(c.Titolo)
    perTitolo.set(chiave, [...(perTitolo.get(chiave) || []), c])
})
const titoliDoppi = [...perTitolo.values()].filter((g) => g.length > 1)

const tagIgnoti = canti.flatMap((c) =>
    (c.Tag || '').split(',').map((t) => t.trim()).filter((t) => t && !VOCABOLARIO.has(normalizeText(t))).map((t) => `${nome(c)}: "${t}"`)
)

const spartitiNonDrive = canti.flatMap((c) =>
    ['Spartito Originale', 'Spartito Modificato']
        .filter((col) => (c[col] || '').trim() && !/drive\.google\.com|docs\.google\.com/.test(c[col]))
        .map((col) => `${nome(c)} (${col}): ${c[col].trim()}`)
)

console.log(`# Report qualità dati

Generato da \`scripts/report-dati.mjs\` su ${canti.length} canti. Serve a chi cura il foglio: nessuna voce blocca l'app.

## Canti senza testo (${senzaTesto.length})

${elenco(senzaTesto.map(nome))}

## Ritornelli scritti tutti in maiuscolo (${ritornelliMaiuscoli.length})

Il ritornello si distingue già da solo nell'app (grassetto e ℟): il maiuscolo lo rende più difficile da leggere.

${elenco(ritornelliMaiuscoli.map(nome))}

## Titoli doppi (${titoliDoppi.length})

Possono essere canti diversi con lo stesso titolo: da controllare a mano.

${elenco(titoliDoppi.map((g) => g.map(nome).join(' / ')))}

## Tag fuori dal vocabolario (${tagIgnoti.length})

Vocabolario: ${[...MOMENTI_NOTI, ...TEMPI_LITURGICI].join(', ')}.

${elenco(tagIgnoti)}

## Spartiti con link non Google Drive (${spartitiNonDrive.length})

${elenco(spartitiNonDrive)}
`)
