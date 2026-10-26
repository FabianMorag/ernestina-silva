import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Championship, Match } from '../../shared/tournament-api.ts'
import { performancePercentage, playerStatistics } from './statistics.ts'

const copa2024: Championship = {
  id: 'copa-2024',
  name: 'Copa América 2024',
  type: 'COPA_AMERICA',
}
const copa2025: Championship = {
  id: 'copa-2025',
  name: 'Copa América 2025',
  type: 'COPA_AMERICA',
}
const world2024: Championship = {
  id: 'world-2024',
  name: 'Mundial 2024',
  type: 'WORLD_CUP',
}
const players = [
  { id: 'ana', name: 'Ana' },
  { id: 'bea', name: 'Bea' },
  { id: 'ceci', name: 'Ceci' },
]

function match(
  id: string,
  championship: Championship,
  homeScore: number,
  awayScore: number,
): Match {
  return {
    id,
    championship,
    homeScore,
    awayScore,
    homePlayer: { id: 'ana', name: 'Ana' },
    awayPlayer: { id: 'bea', name: 'Bea' },
    homeTeam: { id: 'red', name: 'Rojo' },
    awayTeam: { id: 'blue', name: 'Azul' },
    stage: null,
    group: null,
    knockoutRound: null,
    knockoutSlot: null,
  }
}

test('each type combines years while general includes every recorded match', () => {
  const results = playerStatistics(
    [
      match('a', copa2024, 2, 1),
      match('b', copa2025, 1, 1),
      match('c', world2024, 0, 3),
    ],
    [copa2024, copa2025, world2024],
    players,
  )

  assert.deepEqual(
    results.copaAmerica.find((row) => row.playerId === 'ana'),
    {
      playerId: 'ana',
      playerName: 'Ana',
      teamName: 'Rojo',
      played: 2,
      wins: 1,
      draws: 1,
      losses: 0,
      points: 4,
      goalsFor: 3,
      goalsAgainst: 2,
      goalDifference: 1,
    },
  )
  assert.deepEqual(
    results.worldCup.find((row) => row.playerId === 'ana'),
    {
      playerId: 'ana',
      playerName: 'Ana',
      teamName: 'Rojo',
      played: 1,
      wins: 0,
      draws: 0,
      losses: 1,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 3,
      goalDifference: -3,
    },
  )
  assert.deepEqual(
    results.general.find((row) => row.playerId === 'ana'),
    {
      playerId: 'ana',
      playerName: 'Ana',
      teamName: 'Rojo',
      played: 3,
      wins: 1,
      draws: 1,
      losses: 1,
      points: 4,
      goalsFor: 3,
      goalsAgainst: 5,
      goalDifference: -2,
    },
  )
  assert.equal(results.general.find((row) => row.playerId === 'bea')?.points, 4)
})

test('category partition uses stored type rather than championship name', () => {
  const misleading: Championship = {
    id: 'other',
    name: 'Mundial de verano',
    type: 'COPA_AMERICA',
  }
  const results = playerStatistics(
    [match('a', misleading, 1, 0)],
    [misleading],
    players,
  )
  assert.equal(
    results.copaAmerica.find((row) => row.playerId === 'ana')?.played,
    1,
  )
  assert.equal(
    results.worldCup.find((row) => row.playerId === 'ana')?.played,
    0,
  )
})

test('percentage is points divided by maximum available points', () => {
  const rows = playerStatistics(
    [match('a', copa2024, 2, 1), match('b', copa2025, 1, 1)],
    [copa2024, copa2025],
    players,
  ).general
  assert.equal(
    performancePercentage(rows.find((row) => row.playerId === 'ana')!),
    66.7,
  )
  assert.equal(performancePercentage({ ...rows[0], played: 0, points: 0 }), 0)
  assert.deepEqual(playerStatistics([], [copa2024], []).general, [])
})

test('every registered player appears even without matches in that category', () => {
  const result = playerStatistics(
    [match('a', copa2024, 2, 0)],
    [copa2024],
    players,
  )
  const unplayed = result.copaAmerica.find((row) => row.playerId === 'ceci')
  assert.deepEqual(unplayed, {
    playerId: 'ceci',
    playerName: 'Ceci',
    teamName: '',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    points: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  })
  assert.equal(result.worldCup.length, 3)
  assert.equal(result.general.length, 3)
})
