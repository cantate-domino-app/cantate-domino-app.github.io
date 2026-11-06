import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitTags } from './tags.js'

test('separa momenti e tempi', () => {
    assert.deepEqual(splitTags(['ingresso', 'quaresima', 'comunione']), {
        momenti: ['ingresso', 'comunione'],
        tempi: ['quaresima'],
    })
})

test('tag sconosciuto finisce nei momenti', () => {
    assert.deepEqual(splitTags(['matrimonio']), { momenti: ['matrimonio'], tempi: [] })
})

test('riconosce i tempi anche senza accento', () => {
    assert.deepEqual(splitTags(['giovedi santo']).tempi, ['giovedi santo'])
})
