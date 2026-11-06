import { test } from 'node:test'
import assert from 'node:assert/strict'
import { chiamaApi, leggiApi, urlLettura } from './api.js'

const URL_PROVA = 'https://script.example/exec'
const risposta = (testo, ok = true) => async () => ({ ok, text: async () => testo })

test('chiamaApi: restituisce la risposta del server e manda il JSON come testo semplice', async () => {
    let inviato
    const fetchImpl = async (url, opzioni) => {
        inviato = { url, opzioni }
        return { ok: true, text: async () => '{"ok":true,"x":1}' }
    }
    const r = await chiamaApi('verificaParrocchia', { parrocchia: 'sc' }, { fetchImpl, url: URL_PROVA })
    assert.deepEqual(r, { ok: true, x: 1 })
    assert.equal(inviato.opzioni.method, 'POST')
    assert.match(inviato.opzioni.headers['Content-Type'], /^text\/plain/)
    assert.deepEqual(JSON.parse(inviato.opzioni.body), { azione: 'verificaParrocchia', parrocchia: 'sc' })
})

test('chiamaApi: rete assente → niente è stato salvato', async () => {
    const r = await chiamaApi('x', {}, { fetchImpl: async () => { throw new TypeError('Failed to fetch') }, url: URL_PROVA })
    assert.equal(r.ok, false)
    assert.match(r.errore, /niente è stato salvato/)
})

test('chiamaApi: risposta non JSON o errore HTTP → risposta non valida', async () => {
    assert.match((await chiamaApi('x', {}, { fetchImpl: risposta('<html>'), url: URL_PROVA })).errore, /Risposta non valida/)
    assert.match((await chiamaApi('x', {}, { fetchImpl: risposta('{}', false), url: URL_PROVA })).errore, /Risposta non valida.*niente è stato salvato/)
})

test('chiamaApi: server che non risponde → errore dopo il timeout', async () => {
    const r = await chiamaApi('x', {}, { fetchImpl: () => new Promise(() => {}), timeoutMs: 10, url: URL_PROVA })
    assert.equal(r.ok, false)
    assert.match(r.errore, /niente è stato salvato/)
})

test('chiamaApi: senza indirizzo dello script non chiama nulla', async () => {
    const r = await chiamaApi('x', {}, { fetchImpl: () => assert.fail('non doveva chiamare'), url: '' })
    assert.equal(r.ok, false)
})

test('urlLettura e leggiApi', async () => {
    assert.equal(urlLettura('celebrazioni', { parrocchia: 'san-nicolo' }, URL_PROVA), `${URL_PROVA}?azione=celebrazioni&parrocchia=san-nicolo`)
    assert.deepEqual(await leggiApi('parrocchie', {}, { fetchImpl: risposta('{"ok":true,"parrocchie":[]}'), url: URL_PROVA }), { ok: true, parrocchie: [] })
    await assert.rejects(leggiApi('celebrazioni', {}, { fetchImpl: risposta('{"ok":false,"errore":"Parrocchia non trovata."}'), url: URL_PROVA }), /Parrocchia non trovata/)
})
