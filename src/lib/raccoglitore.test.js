import { test } from 'node:test'
import assert from 'node:assert/strict'
import { trovaColonnaRaccoglitore, riferimentoRaccoglitore } from './raccoglitore.js'

test('senza colonna nel foglio il riferimento è l\'ID (tutti nel raccoglitore)', () => {
    assert.equal(riferimentoRaccoglitore({ ID: ' A12 ' }, null), 'A12')
})

test('con la colonna il riferimento è quello scritto', () => {
    assert.equal(riferimentoRaccoglitore({ ID: 'A12', Raccoglitore: ' B3 ' }, 'Raccoglitore'), 'B3')
})

test('con la colonna, cella vuota = non nel raccoglitore', () => {
    assert.equal(riferimentoRaccoglitore({ ID: 'A12', Raccoglitore: '' }, 'Raccoglitore'), '')
    assert.equal(riferimentoRaccoglitore({ ID: 'A12' }, 'Raccoglitore'), '')
})

test('trova la colonna anche con maiuscole e spazi diversi', () => {
    assert.equal(trovaColonnaRaccoglitore(['ID', 'Titolo', ' raccoglitore ']), ' raccoglitore ')
    assert.equal(trovaColonnaRaccoglitore(['ID', 'Titolo']), null)
})
