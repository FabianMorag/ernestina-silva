import assert from 'node:assert/strict'
import { test } from 'node:test'
import { publicCountLabel, publicListingLabel } from './listing.ts'

test('championship counts are pluralized in Spanish', () => {
  assert.equal(publicCountLabel(2), '2 CAMPEONATOS')
  assert.equal(publicCountLabel(1), '1 CAMPEONATO')
})

test('a zero count keeps the plural and never hides the label', () => {
  assert.equal(publicCountLabel(0), '0 CAMPEONATOS')
})

test('the listing keeps an accessible name after the visible duplicate title is removed', () => {
  assert.equal(publicListingLabel, 'Lista de campeonatos')
})
