import assert from 'node:assert/strict'
import { test } from 'node:test'
import { publicCountLabel, publicListingLabel } from './listing.ts'

test('counts are pluralized in Spanish for both listings', () => {
  assert.equal(publicCountLabel('championships', 2), '2 CAMPEONATOS')
  assert.equal(publicCountLabel('championships', 1), '1 CAMPEONATO')
  assert.equal(publicCountLabel('matches', 15), '15 PARTIDOS')
  assert.equal(publicCountLabel('matches', 1), '1 PARTIDO')
})

test('a zero count keeps the plural and never hides the label', () => {
  assert.equal(publicCountLabel('championships', 0), '0 CAMPEONATOS')
  assert.equal(publicCountLabel('matches', 0), '0 PARTIDOS')
})

test('the listing keeps an accessible name after the visible duplicate title is removed', () => {
  assert.equal(publicListingLabel('championships'), 'Lista de campeonatos')
  assert.equal(publicListingLabel('matches'), 'Partidos registrados')
})
