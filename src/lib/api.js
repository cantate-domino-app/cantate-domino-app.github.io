import { API_URL } from '../config.js'

const ERRORE_RETE = 'Connessione assente o lenta: niente è stato salvato. Riprova.'
const ERRORE_RISPOSTA = 'Risposta non valida dal server: niente è stato salvato. Riprova.'

export function urlLettura(azione, params = {}, url = API_URL) {
    return `${url}?${new URLSearchParams({ azione, ...params })}`
}

function conTimeout(promessa, ms) {
    let timer
    const scadenza = new Promise((_, rifiuta) => { timer = setTimeout(() => rifiuta(new Error('timeout')), ms) })
    return Promise.race([promessa, scadenza]).finally(() => clearTimeout(timer))
}

// Scrittura verso lo script. text/plain evita il preflight CORS, che Apps Script non gestisce.
// Non lancia mai: restituisce sempre { ok, errore? } da mostrare all'utente.
export async function chiamaApi(azione, dati, { fetchImpl = fetch, timeoutMs = 15000, url = API_URL } = {}) {
    if (!url) return { ok: false, errore: 'Indirizzo del server non configurato.' }
    let res
    try {
        res = await conTimeout(fetchImpl(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ azione, ...dati }),
        }), timeoutMs)
    } catch {
        return { ok: false, errore: ERRORE_RETE }
    }
    try {
        if (!res.ok) throw new Error(res.status)
        const risposta = JSON.parse(await res.text())
        return typeof risposta?.ok === 'boolean' ? risposta : { ok: false, errore: ERRORE_RISPOSTA }
    } catch {
        return { ok: false, errore: ERRORE_RISPOSTA }
    }
}

export async function leggiApi(azione, params = {}, { fetchImpl = fetch, timeoutMs = 15000, url = API_URL } = {}) {
    if (!url) throw new Error('Indirizzo del server non configurato.')
    const res = await conTimeout(fetchImpl(urlLettura(azione, params, url)), timeoutMs)
    if (!res.ok) throw new Error(ERRORE_RISPOSTA)
    const dati = JSON.parse(await res.text())
    if (!dati.ok) throw new Error(dati.errore || ERRORE_RISPOSTA)
    return dati
}
