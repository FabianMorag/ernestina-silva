import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pageForPath } from './routes.ts'

test('public pages do not route through admin authentication', () => {
  assert.equal(pageForPath('/'), 'home')
  assert.equal(pageForPath('/partidos'), 'matches')
  assert.equal(pageForPath('/campeonatos'), 'championships')
  assert.equal(pageForPath('/admin'), 'admin')
  assert.equal(pageForPath('/admin/'), 'admin')
})
