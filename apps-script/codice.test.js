import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { carica } from './carica.js'

// Foglio finto in memoria: solo i metodi usati da Codice.js.
function finta(schede) {
    const crea = (nome, valori) => {
        const s = {
            nome,
            valori,
            getName: () => s.nome,
            setName: (n) => { s.nome = n },
            getDataRange: () => ({ getDisplayValues: () => s.valori.map((r) => r.map(String)) }),
            appendRow: (riga) => { s.valori.push(riga.map(String)) },
            clearContents: () => { s.valori = [] },
            getRange: () => {
                const r = { setNumberFormat: () => r, setValues: (v) => { s.valori = v.map((x) => x.map(String)) } }
                return r
            },
        }
        return s
    }
    const elenco = Object.entries(schede).map(([n, v]) => crea(n, v))
    const cache = new Map()
    const proprieta = new Map()
    const ambiente = {
        SpreadsheetApp: {
            getActive: () => ({
                getSheetByName: (n) => elenco.find((s) => s.nome === n) || null,
                getSheets: () => elenco,
                insertSheet: (n) => { const s = crea(n, []); elenco.push(s); return s },
            }),
        },
        ContentService: {
            MimeType: { JSON: 'json' },
            createTextOutput: (testo) => ({ testo, setMimeType() { return this } }),
        },
        Utilities: {
            DigestAlgorithm: { SHA_256: 'sha256' },
            Charset: { UTF_8: 'utf8' },
            computeDigest: (_a, t) => [...createHash('sha256').update(t, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
            getUuid: () => randomUUID(),
        },
        CacheService: {
            getScriptCache: () => ({
                get: (k) => cache.get(k) ?? null,
                put: (k, v) => cache.set(k, v),
                remove: (k) => cache.delete(k),
            }),
        },
        LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: (k) => proprieta.get(k) ?? null,
                setProperties: (o) => Object.entries(o).forEach(([k, v]) => proprieta.set(k, v)),
            }),
        },
    }
    const S = carica(['Logica.js', 'Codice.js'], ambiente)
    const scheda = (n) => elenco.find((s) => s.nome === n)
    return {
        S,
        scheda,
        get: (parametri) => JSON.parse(S.doGet({ parameter: parametri }).testo),
        post: (dati) => JSON.parse(S.doPost({ postData: { contents: JSON.stringify(dati) } }).testo),
        impostaAdmin: (password) => {
            proprieta.set('ADMIN_SALE', 'saleadmin')
            proprieta.set('ADMIN_HASH', S.hashPassword(password, 'saleadmin', ambiente.Utilities.computeDigest.bind(null, '')))
        },
    }
}

function nuovoFoglio() {
    const f = finta({
        Canti: [['ID', 'Titolo', 'Autori', 'Tag', 'Link Youtube', 'Testo', 'Note'], ['A1', 'Acclamate', '', '', '', '', ''], ['A2', 'Alleluia', '', '', '', '', ''], ['B1', 'Benedici', '', '', '', '', '']],
        Celebrazioni: [['Celebrazione', 'Momento', 'Canto_ID', 'Note'], ['Messa 10:30', 'Ingresso', 'a1', ''], ['', 'Finale', 'B1', '']],
    })
    f.S.preparaDatabase()
    f.impostaAdmin('admin-segreta')
    f.post({ azione: 'impostaPassword', adminPassword: 'admin-segreta', parrocchia: 'santa-chiara', password: 'coro-sc' })
    return f
}

test('preparaDatabase converte le vecchie celebrazioni e riempie il raccoglitore di Santa Chiara', () => {
    const f = nuovoFoglio()
    assert.ok(f.scheda('Celebrazioni (vecchio)'))
    const c = f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' })
    assert.equal(c.ok, true)
    assert.deepEqual(c.righe.map((r) => [r.celebrazione, r.ordine, r.cantoId]), [['Messa 10:30', 1, 'a1'], ['Messa 10:30', 2, 'B1']])
    assert.deepEqual(c.raccoglitore.map((r) => r.riferimento), ['A1', 'A2', 'B1'])
    f.S.preparaDatabase()
    assert.equal(f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).righe.length, 2)
    assert.equal(f.get({ azione: 'parrocchie' }).parrocchie.length, 1)
})

test('parrocchie non espone sale né hash', () => {
    const f = nuovoFoglio()
    const p = f.get({ azione: 'parrocchie' }).parrocchie[0]
    assert.deepEqual(Object.keys(p).sort(), ['citta', 'nome', 'slug'])
})

test('salvaCelebrazione: password giusta scrive, sbagliata no, al quinto errore blocca', () => {
    const f = nuovoFoglio()
    const righe = [{ momento: 'Gloria', cantoId: 'A2', note: '' }]
    assert.equal(f.post({ azione: 'salvaCelebrazione', parrocchia: 'santa-chiara', password: 'coro-sc', celebrazione: 'Messa 12', righe }).ok, true)
    assert.equal(f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).righe.length, 3)

    const sbagliata = f.post({ azione: 'salvaCelebrazione', parrocchia: 'santa-chiara', password: 'no', celebrazione: 'X', righe })
    assert.deepEqual(sbagliata, { ok: false, errore: 'Parrocchia o password non corretti.' })
    const inesistente = f.post({ azione: 'verificaParrocchia', parrocchia: 'nessuna', password: 'no' })
    assert.equal(inesistente.errore, sbagliata.errore)

    for (let i = 0; i < 3; i++) f.post({ azione: 'verificaParrocchia', parrocchia: 'santa-chiara', password: 'no' })
    const quinto = f.post({ azione: 'verificaParrocchia', parrocchia: 'santa-chiara', password: 'no' })
    assert.equal(quinto.errore, 'Troppi tentativi, riprova tra 10 minuti.')
    const giustaMaBloccata = f.post({ azione: 'verificaParrocchia', parrocchia: 'santa-chiara', password: 'coro-sc' })
    assert.equal(giustaMaBloccata.errore, 'Troppi tentativi, riprova tra 10 minuti.')
    assert.equal(f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).righe.length, 3)
})

test('salvaCelebrazione rifiuta un canto inesistente', () => {
    const f = nuovoFoglio()
    const r = f.post({ azione: 'salvaCelebrazione', parrocchia: 'santa-chiara', password: 'coro-sc', celebrazione: 'M', righe: [{ momento: 'X', cantoId: 'ZZ1' }] })
    assert.equal(r.ok, false)
    assert.match(r.errore, /ZZ1/)
})

test('proponiCanto e accettaProposta con il codice proposto', () => {
    const f = nuovoFoglio()
    assert.equal(f.post({ azione: 'proponiCanto', titolo: ' ' }).ok, false)
    assert.equal(f.post({ azione: 'proponiCanto', titolo: 'Ave Maria', link: 'https://youtu.be/x' }).ok, true)

    assert.equal(f.post({ azione: 'elencoProposte', adminPassword: 'no' }).errore, 'Password admin non corretta.')
    const [proposta] = f.post({ azione: 'elencoProposte', adminPassword: 'admin-segreta' }).proposte
    assert.equal(proposta.codiceProposto, 'A3')

    const doppio = f.post({ azione: 'accettaProposta', adminPassword: 'admin-segreta', id: proposta.id, codice: 'a1' })
    assert.equal(doppio.ok, false)
    assert.equal(f.post({ azione: 'accettaProposta', adminPassword: 'admin-segreta', id: proposta.id, codice: 'A3', tag: 'mariano' }).ok, true)

    const canti = f.get({ azione: 'catalogo' }).canti
    assert.deepEqual(canti.at(-1), { ID: 'A3', Titolo: 'Ave Maria', Autori: '', Tag: 'mariano', 'Link Youtube': 'https://youtu.be/x', Testo: '', Note: '' })
    assert.equal(f.post({ azione: 'elencoProposte', adminPassword: 'admin-segreta' }).proposte.length, 0)
    // Il canto nuovo non entra nel raccoglitore di nessuno
    assert.equal(f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).raccoglitore.some((r) => r.cantoId === 'A3'), false)
})

test('salvaRiferimento: riferimento già usato rifiutato, vuoto toglie dal raccoglitore', () => {
    const f = nuovoFoglio()
    const base = { azione: 'salvaRiferimento', parrocchia: 'santa-chiara', password: 'coro-sc' }
    const occupato = f.post({ ...base, cantoId: 'A2', riferimento: 'b1' })
    assert.equal(occupato.ok, false)
    assert.match(occupato.errore, /B1/)
    assert.equal(f.post({ ...base, cantoId: 'A2', riferimento: '' }).ok, true)
    const rac = f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).raccoglitore
    assert.deepEqual(rac.map((r) => r.cantoId), ['A1', 'B1'])
    assert.equal(f.post({ ...base, cantoId: 'A2', riferimento: 'A9' }).ok, true)
    assert.equal(f.get({ azione: 'celebrazioni', parrocchia: 'santa-chiara' }).raccoglitore.length, 3)
})

test('creaParrocchia: slug stabile, doppione rifiutato, parte con raccoglitore vuoto', () => {
    const f = nuovoFoglio()
    const r = f.post({ azione: 'creaParrocchia', adminPassword: 'admin-segreta', nome: 'San Nicolò', citta: 'Bari', password: 'coro-sn' })
    assert.equal(r.parrocchia.slug, 'san-nicolo')
    assert.equal(f.post({ azione: 'creaParrocchia', adminPassword: 'admin-segreta', nome: 'SAN NICOLO', password: 'altra-pw' }).ok, false)
    assert.equal(f.post({ azione: 'verificaParrocchia', parrocchia: 'san-nicolo', password: 'coro-sn' }).ok, true)
    assert.deepEqual(f.get({ azione: 'celebrazioni', parrocchia: 'san-nicolo' }).raccoglitore, [])
    assert.doesNotMatch(JSON.stringify(f.scheda('Parrocchie').valori), /coro-sn/)
})

test('proponiCanto: un titolo che sembra una formula viene scritto come testo', () => {
    const f = nuovoFoglio()
    assert.equal(f.post({ azione: 'proponiCanto', titolo: '=IMPORTDATA("https://x")', note: '-1' }).ok, true)
    const riga = f.scheda('Proposte').valori.at(-1)
    assert.ok(riga.includes('\'=IMPORTDATA("https://x")'))
    assert.ok(riga.includes('\'-1'))
})

test('preparaDatabase rinomina in "Canti" la scheda del catalogo, anche se non è la prima', () => {
    const f = finta({
        Altro: [['Appunti'], ['x']],
        Foglio1: [['ID', 'Titolo', 'Autori', 'Tag', 'Link Youtube', 'Testo', 'Note'], ['A1', 'Acclamate', '', '', '', '', '']],
    })
    f.S.preparaDatabase()
    assert.ok(f.scheda('Canti'))
    assert.equal(f.get({ azione: 'catalogo' }).canti[0].ID, 'A1')
})

test('catalogo: senza scheda "Canti" risponde con un errore, non con la prima scheda', () => {
    const f = finta({ Proposte: [['Id', 'Titolo'], ['p1', 'Ave']] })
    assert.equal(f.get({ azione: 'catalogo' }).ok, false)
})
