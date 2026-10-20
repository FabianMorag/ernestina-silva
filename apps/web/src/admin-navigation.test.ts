import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminPageForPath, rosterForChampionship, unassignedPlayers } from './admin-navigation.ts'
import { pageForPath } from './routes.ts'
import type { Participant, Player } from './tournament-api.ts'

const players: Player[] = [
  { id: 'carrasco', name: 'Carrasco', title: null },
  { id: 'anito', name: 'Anito', title: null },
  { id: 'borito', name: 'Borito', title: null },
]
const participants: Participant[] = [
  { id: 'one', championshipId: 'cup', playerId: 'carrasco', teamId: 'arsenal', player: players[0], team: { id: 'arsenal', name: 'Arsenal' } },
  { id: 'two', championshipId: 'other', playerId: 'anito', teamId: 'milan', player: players[1], team: { id: 'milan', name: 'Milan' } },
]

test('admin sections have direct URLs without changing public route handling', () => {
  assert.equal(adminPageForPath('/admin'), 'championships')
  assert.equal(adminPageForPath('/admin/jugadores/'), 'players')
  assert.equal(adminPageForPath('/admin/equipos'), 'teams')
  assert.equal(adminPageForPath('/admin/campeonatos'), 'championships')
  assert.equal(adminPageForPath('/admin/partidos'), 'matches')
  assert.equal(adminPageForPath('/admin/desconocido'), 'not-found')
  assert.equal(adminPageForPath('/partidos'), null)
  assert.equal(pageForPath('/partidos'), 'matches')
  assert.equal(pageForPath('/campeonatos'), 'championships')
})

test('each championship roster includes only its assigned players and teams', () => {
  assert.deepEqual(rosterForChampionship(participants, 'cup'), [participants[0]])
  assert.deepEqual(unassignedPlayers(players, participants, 'cup').map((player) => player.id), ['anito', 'borito'])
  assert.deepEqual(rosterForChampionship(participants, 'other'), [participants[1]])
  assert.deepEqual(unassignedPlayers(players, participants, 'other').map((player) => player.id), ['carrasco', 'borito'])
})
