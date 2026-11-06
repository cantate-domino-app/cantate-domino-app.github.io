import { test } from 'node:test'
import assert from 'node:assert/strict'
import { riferimentoProposto, prefissoDi } from './raccoglitore.js'

test('riferimentoProposto: primo numero libero, buchi compresi', () => {
    assert.equal(riferimentoProposto(['A1', 'a2', 'B1'], 'A'), 'A3')
    assert.equal(riferimentoProposto(['A1', 'A3', 'ALL2'], 'a'), 'A2')
    assert.equal(riferimentoProposto([], 'C'), 'C1')
})

test('prefissoDi: le lettere iniziali del codice', () => {
    assert.equal(prefissoDi('all17'), 'ALL')
    assert.equal(prefissoDi('A27'), 'A')
})
