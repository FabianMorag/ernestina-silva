import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveRoute, withChampionshipParam } from './route-table.ts'

test('public pages keep their URLs and do not route through admin', () => {
  assert.deepEqual(resolveRoute('/'), {
    id: 'home',
    area: 'public',
    page: 'home',
  })
  assert.deepEqual(resolveRoute('/partidos'), {
    id: 'publicMatches',
    area: 'public',
    page: 'matches',
  })
  assert.deepEqual(resolveRoute('/campeonatos'), {
    id: 'publicChampionships',
    area: 'public',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/partidos/'), {
    id: 'publicMatches',
    area: 'public',
    page: 'matches',
  })
})

test('admin sections keep their direct URLs', () => {
  assert.deepEqual(resolveRoute('/admin'), {
    id: 'adminChampionships',
    area: 'admin',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/admin/'), {
    id: 'adminChampionships',
    area: 'admin',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/admin/campeonatos'), {
    id: 'adminChampionships',
    area: 'admin',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/admin/campeonatos/nuevo'), {
    id: 'adminChampionshipsNew',
    area: 'admin',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/admin/campeonatos/copa-2026'), {
    id: 'adminChampionshipDetail',
    area: 'admin',
    page: 'championships',
  })
  assert.deepEqual(resolveRoute('/admin/jugadores/'), {
    id: 'adminPlayers',
    area: 'admin',
    page: 'players',
  })
  assert.deepEqual(resolveRoute('/admin/equipos'), {
    id: 'adminTeams',
    area: 'admin',
    page: 'teams',
  })
  assert.deepEqual(resolveRoute('/admin/partidos'), {
    id: 'adminMatches',
    area: 'admin',
    page: 'matches',
  })
})

test('unknown paths show the not-found page of their area', () => {
  assert.deepEqual(resolveRoute('/admin/desconocido'), {
    id: 'adminNotFound',
    area: 'admin',
    page: 'not-found',
  })
  assert.deepEqual(resolveRoute('/otra-cosa'), {
    id: 'publicNotFound',
    area: 'public',
    page: 'not-found',
  })
})

test('championship selection updates only its search parameter', () => {
  assert.equal(
    withChampionshipParam(
      new URLSearchParams('view=compact'),
      'cup',
    ).toString(),
    'view=compact&campeonato=cup',
  )
  assert.equal(
    withChampionshipParam(
      new URLSearchParams('view=compact&campeonato=cup'),
      '',
    ).toString(),
    'view=compact',
  )
})

test('public championship detail has its own direct URL', () => {
  assert.deepEqual(resolveRoute('/campeonatos/copa-2026'), {
    id: 'publicChampionshipDetail',
    area: 'public',
    page: 'championship',
  })
  assert.deepEqual(resolveRoute('/campeonatos/copa%202026/'), {
    id: 'publicChampionshipDetail',
    area: 'public',
    page: 'championship',
  })
  assert.deepEqual(resolveRoute('/campeonatos'), {
    id: 'publicChampionships',
    area: 'public',
    page: 'championships',
  })
})
