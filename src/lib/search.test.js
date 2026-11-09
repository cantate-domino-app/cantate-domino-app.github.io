import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSearchIndex, searchSongs } from './search.js'

const songs = [
    { id: 'C1', title: 'Canto della gioia', author: 'X', tags: [], lyrics: '' },
    { id: 'A2', title: 'Acclamate al Signore', author: 'Frisina', tags: ['ingresso'], lyrics: '' },
    { id: 'A1', title: 'Acclamate al Signore', author: 'Rinaldi', tags: ['ingresso'], lyrics: 'servitelo con gioia' },
    { id: 'P1', title: 'Pietà di noi', author: 'Y', tags: ['perdono'], lyrics: '' },
]
const index = buildSearchIndex(songs)
const ids = (res) => res.map((s) => s.id)

test('titolo esatto prima di tutto', () => {
    const res = ids(searchSongs(index, 'Acclamate al Signore'))
    assert.deepEqual(res.slice(0, 2).sort(), ['A1', 'A2'])
})

test('ricerca senza accenti', () => {
    assert.deepEqual(ids(searchSongs(index, 'pieta')), ['P1'])
})

test('tutti i token devono esserci (AND)', () => {
    assert.deepEqual(ids(searchSongs(index, 'acclamate frisina')), ['A2'])
})

test('riferimento della parrocchia: solo esatto, l\'ID interno non si cerca', () => {
    const riferimentoDi = (id) => ({ C1: 'B7', P1: 'B70' })[id] || ''
    assert.deepEqual(ids(searchSongs(index, 'b7', riferimentoDi)), ['C1'])
    assert.deepEqual(ids(searchSongs(index, 'c1', riferimentoDi)), [])
    assert.deepEqual(ids(searchSongs(index, 'c1')), [])
})

test('parole del testo', () => {
    assert.deepEqual(ids(searchSongs(index, 'servitelo')), ['A1'])
})

test('query vuota restituisce tutto', () => {
    assert.equal(searchSongs(index, '  ').length, songs.length)
})
