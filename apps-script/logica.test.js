import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { carica } from './carica.js'

const grezzo = carica('Logica.js')
// Gli oggetti nati nel contesto vm hanno un altro Object.prototype: li riportiamo a oggetti semplici.
const L = new Proxy(grezzo, {
    get: (c, nome) => (...args) => {
        const r = c[nome](...args)
        return r && typeof r === 'object' ? JSON.parse(JSON.stringify(r)) : r
    },
})
const sha256 = (testo) => [...createHash('sha256').update(testo, 'utf8').digest()]

test('creaSlug: minuscolo, senza accenti, trattini singoli', () => {
    assert.equal(L.creaSlug('San Nicolò'), 'san-nicolo')
    assert.equal(L.creaSlug('  S. Maria  Assunta '), 's-maria-assunta')
})

test('hashPassword: stesso sale stesso hash, sale diverso hash diverso', () => {
    const a = L.hashPassword('coro', 'sale1', sha256)
    assert.equal(a, L.hashPassword('coro', 'sale1', sha256))
    assert.notEqual(a, L.hashPassword('coro', 'sale2', sha256))
    assert.match(a, /^[0-9a-f]{64}$/)
})

test('hashPassword: accetta i byte con segno di Apps Script', () => {
    const conSegno = (t) => sha256(t).map((b) => (b > 127 ? b - 256 : b))
    assert.equal(L.hashPassword('coro', 's', conSegno), L.hashPassword('coro', 's', sha256))
})

test('prossimoIdProgressivo: numero successivo all\'ultimo ordinale', () => {
    assert.equal(L.prossimoIdProgressivo(['A1', 'B2']), '1')
    assert.equal(L.prossimoIdProgressivo(['A1', '1', '2', ' 7 ']), '8')
    assert.equal(L.prossimoIdProgressivo([]), '1')
})

test('riferimentoProposto: primo numero libero nel raccoglitore', () => {
    assert.equal(L.riferimentoProposto(['A1', 'A2'], 'A'), 'A3')
    assert.equal(L.riferimentoProposto([], 'C'), 'C1')
})

test('riferimentiIniziali: senza colonna il riferimento è l\'ID', () => {
    const righe = [{ ID: 'A1' }, { ID: ' B2 ' }]
    assert.deepEqual(L.riferimentiIniziali(righe, null), [
        { cantoId: 'A1', riferimento: 'A1' },
        { cantoId: 'B2', riferimento: 'B2' },
    ])
})

test('riferimentiIniziali: con la colonna solo le righe compilate', () => {
    const righe = [{ ID: 'A1', Raccoglitore: 'A1' }, { ID: 'A2', Raccoglitore: '' }, { ID: 'N1', Raccoglitore: 'B7' }]
    assert.deepEqual(L.riferimentiIniziali(righe, 'Raccoglitore'), [
        { cantoId: 'A1', riferimento: 'A1' },
        { cantoId: 'N1', riferimento: 'B7' },
    ])
})

test('validaRighe: accetta righe valide e normalizza gli spazi', () => {
    const r = L.validaRighe([{ momento: ' Ingresso ', cantoId: 'a1 ', note: '' }], new Set(['A1']))
    assert.equal(r.ok, true)
    assert.deepEqual(r.righe, [{ momento: 'Ingresso', cantoId: 'a1', note: '' }])
})

test('validaRighe: rifiuta un canto inesistente citandone l\'ID', () => {
    const r = L.validaRighe([{ momento: 'Ingresso', cantoId: 'ZZ9' }], new Set(['A1']))
    assert.equal(r.ok, false)
    assert.match(r.errore, /ZZ9/)
})

test('validaRighe: rifiuta momento vuoto e più di 40 righe', () => {
    assert.equal(L.validaRighe([{ momento: ' ', cantoId: 'A1' }], new Set(['A1'])).ok, false)
    const tante = Array.from({ length: 41 }, () => ({ momento: 'X', cantoId: 'A1' }))
    assert.equal(L.validaRighe(tante, new Set(['A1'])).ok, false)
})

test('sostituisciCelebrazione: non tocca altre parrocchie né altre celebrazioni', () => {
    const tutte = [
        { parrocchia: 'sc', celebrazione: 'Messa', ordine: 1, momento: 'Ingresso', cantoId: 'A1', note: '' },
        { parrocchia: 'sc', celebrazione: 'Messa', ordine: 2, momento: 'Finale', cantoId: 'A2', note: '' },
        { parrocchia: 'sc', celebrazione: 'Adorazione', ordine: 1, momento: 'X', cantoId: 'B1', note: '' },
        { parrocchia: 'sn', celebrazione: 'Messa', ordine: 1, momento: 'Ingresso', cantoId: 'C1', note: '' },
    ]
    const nuove = [{ momento: 'Gloria', cantoId: 'G1', note: '' }, { momento: 'Pace', cantoId: 'P1', note: 'piano' }]
    const r = L.sostituisciCelebrazione(tutte, 'sc', 'Messa', nuove)
    assert.deepEqual(r.filter((x) => !(x.parrocchia === 'sc' && x.celebrazione === 'Messa')), tutte.slice(2))
    assert.deepEqual(r.filter((x) => x.parrocchia === 'sc' && x.celebrazione === 'Messa'), [
        { parrocchia: 'sc', celebrazione: 'Messa', ordine: 1, momento: 'Gloria', cantoId: 'G1', note: '' },
        { parrocchia: 'sc', celebrazione: 'Messa', ordine: 2, momento: 'Pace', cantoId: 'P1', note: 'piano' },
    ])
    assert.equal(L.sostituisciCelebrazione(tutte, 'sc', 'Messa', []).length, 2)
})

test('convertiCelebrazioniVecchie: il CSV di oggi diventa 29 righe', () => {
    const csv = readFileSync(new URL('fixture/celebrazioni-vecchie.csv', import.meta.url), 'utf8')
    const righe = L.convertiCelebrazioniVecchie(Papa.parse(csv).data, 'santa-chiara')
    assert.equal(righe.length, 29)
    assert.equal(righe.some((r) => r.momento === 'Padre Nostro' && r.celebrazione === 'Messa 12:15'), false)
    assert.equal(righe.some((r) => r.cantoId === 'ALDO'), false)
    assert.deepEqual(righe[0], { parrocchia: 'santa-chiara', celebrazione: 'Messa 10:30', ordine: 1, momento: 'Ingresso', cantoId: 'c10', note: '' })
    const adorazione = righe.filter((r) => r.celebrazione === 'Adorazione')
    assert.deepEqual(adorazione.map((r) => r.ordine), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('convertiCelebrazioniVecchie: la celebrazione vuota eredita la precedente', () => {
    const righe = L.convertiCelebrazioniVecchie(
        [['Celebrazione', 'Momento', 'Canto_ID', 'Note'], ['Messa', 'Ingresso', 'A1', ''], ['', 'Finale', 'A2', 'x']],
        'sc',
    )
    assert.equal(righe[1].celebrazione, 'Messa')
    assert.equal(righe[1].ordine, 2)
})

test('tentativiSuperati: dal quinto tentativo sbagliato', () => {
    assert.equal(L.tentativiSuperati(4), false)
    assert.equal(L.tentativiSuperati(5), true)
})

test('cellaSicura: un testo che inizia come una formula resta testo', () => {
    assert.equal(L.cellaSicura('=HYPERLINK("x";"y")'), '\'=HYPERLINK("x";"y")')
    assert.equal(L.cellaSicura('+39 333'), '\'+39 333')
    assert.equal(L.cellaSicura('@utente'), '\'@utente')
    assert.equal(L.cellaSicura('Ave Maria'), 'Ave Maria')
    assert.equal(L.cellaSicura(3), '3')
})
