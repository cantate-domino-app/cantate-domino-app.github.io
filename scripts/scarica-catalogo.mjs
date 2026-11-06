// Scarica il catalogo dallo script Apps Script e lo salva in public/canti.json,
// così l'app lo legge dalla stessa origine invece di aspettare Google a ogni apertura.
// Uso: VITE_API_URL=<url dello script> node scripts/scarica-catalogo.mjs
import { writeFileSync } from 'node:fs'

const MINIMO_CANTI = 10

const url = process.env.VITE_API_URL
if (!url) {
    console.error('Manca la variabile VITE_API_URL.')
    process.exit(1)
}

const res = await fetch(`${url}?azione=catalogo`)
const dati = await res.json()
// Protezione: un foglio vuoto o rotto non deve svuotare l'app pubblicata.
if (!dati.ok || !Array.isArray(dati.canti) || dati.canti.length < MINIMO_CANTI) {
    console.error('Catalogo non valido:', dati.errore || `${dati.canti?.length ?? 0} canti`)
    process.exit(1)
}
writeFileSync(new URL('../public/canti.json', import.meta.url), JSON.stringify({ canti: dati.canti }))
console.log(`Scaricati ${dati.canti.length} canti.`)
