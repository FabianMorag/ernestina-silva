import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  calculatePlayerStandings,
  groupStageMatches,
  leagueStageMatches,
} from './standings.ts'
import type {
  Match,
  Participant,
  Player,
  Item,
} from '../../shared/tournament-api.ts'

const teamRojo: Item = { id: 't-rojo', name: 'Rojo FC' }
const teamAzul: Item = { id: 't-azul', name: 'Azul FC' }
const teamVerde: Item = { id: 't-verde', name: 'Verde FC' }

function player(id: string, name: string): Player {
  return { id, name, title: null }
}

const ana = player('p-ana', 'Ana')
const beto = player('p-beto', 'Beto')
const cata = player('p-cata', 'Cata')
const dani = player('p-dani', 'Dani')

function game(
  id: string,
  home: Player,
  away: Player,
  homeScore: number,
  awayScore: number,
  stageKind: 'GROUP' | 'LEAGUE' | 'KNOCKOUT' | null,
  groupId: string | null,
): Match {
  return {
    id,
    homeScore,
    awayScore,
    homePlayer: home,
    awayPlayer: away,
    homeTeam: teamRojo,
    awayTeam: teamAzul,
    championship: { id: 'cup', name: 'Copa' },
    stage: stageKind
      ? { id: `stage-${stageKind}`, kind: stageKind, championshipId: 'cup' }
      : null,
    group: groupId
      ? { id: groupId, stageId: 'stage-GROUP', name: groupId }
      : null,
    knockoutRound: null,
    knockoutSlot: null,
  }
}

function participant(item: Player, team: Item): Participant {
  return {
    id: `participant-${item.id}`,
    championshipId: 'cup',
    playerId: item.id,
    teamId: team.id,
    player: item,
    team,
  }
}

const participants: Participant[] = [
  participant(ana, teamRojo),
  participant(beto, teamAzul),
  participant(cata, teamVerde),
  participant(dani, teamVerde),
]

const summarize = (rows: ReturnType<typeof calculatePlayerStandings>) =>
  rows.map((row) => [
    row.playerName,
    row.points,
    row.goalDifference,
    row.goalsFor,
  ])

test('standings award 3/1/0 points and order by points, then goal difference', () => {
  // Ana: W 4-0, Beto: W 2-0 vs Cata, Cata/Dani: D 1-1
  const matches = [
    game('m1', ana, beto, 4, 0, 'GROUP', 'g-a'),
    game('m2', beto, cata, 2, 0, 'GROUP', 'g-a'),
    game('m3', cata, dani, 1, 1, 'GROUP', 'g-a'),
  ]
  // Ana 3pts GD+4; Beto 3pts GD-2 (GF2); Cata 1pt GD-2 (GF1); Dani 1pt GD0
  assert.deepEqual(summarize(calculatePlayerStandings(matches, participants)), [
    ['Ana', 3, 4, 4],
    ['Beto', 3, -2, 2],
    ['Dani', 1, 0, 1],
    ['Cata', 1, -2, 1],
  ])
})

test('equal points and goal difference are ordered by goals scored', () => {
  const zoe = player('p-zoe', 'Zoe')
  const bruno = player('p-bruno', 'Bruno')
  const eli = player('p-eli', 'Eli')
  const ana2 = player('p-ana2', 'Ana')
  const matches = [
    game('m1', zoe, bruno, 3, 2, 'GROUP', 'g-a'),
    game('m2', ana2, eli, 2, 1, 'GROUP', 'g-a'),
  ]
  // Zoe and Ana: 3pts GD+1; GF 3 beats GF 2 even though "Zoe" sorts last.
  assert.deepEqual(summarize(calculatePlayerStandings(matches, [])), [
    ['Zoe', 3, 1, 3],
    ['Ana', 3, 1, 2],
    ['Bruno', 0, -1, 2],
    ['Eli', 0, -1, 1],
  ])
})

test('fully equal rows are ordered by player name, then stable ID', () => {
  const carla = player('p-carla', 'Carla')
  const bruno = player('p-bruno', 'Bruno')
  const homonimo = player('p-homonimo', 'Bruno')
  const eli = player('p-eli', 'Eli')
  const matches = [
    game('m1', carla, bruno, 0, 0, 'GROUP', 'g-a'),
    game('m2', homonimo, eli, 0, 0, 'GROUP', 'g-a'),
  ]
  // Every row has 1 point, GD 0, GF 0: order by name, then by distinct ID.
  const rows = calculatePlayerStandings(matches, [])
  assert.deepEqual(
    rows.map((row) => row.playerId),
    ['p-bruno', 'p-homonimo', 'p-carla', 'p-eli'],
  )
})

test('group and league tables use only their own stage and group matches', () => {
  const matches = [
    game('group-a', ana, beto, 1, 0, 'GROUP', 'g-a'),
    game('group-b', cata, dani, 2, 0, 'GROUP', 'g-b'),
    game('league', ana, cata, 0, 1, 'LEAGUE', null),
    game('knockout', beto, dani, 3, 3, 'KNOCKOUT', null),
    game('unassigned-group-stage', ana, dani, 5, 0, 'GROUP', null),
    game('no-stage', beto, cata, 5, 0, null, null),
  ]
  assert.deepEqual(
    groupStageMatches(matches, 'g-a').map((m) => m.id),
    ['group-a'],
  )
  assert.deepEqual(
    groupStageMatches(matches, 'g-b').map((m) => m.id),
    ['group-b'],
  )
  assert.deepEqual(
    leagueStageMatches(matches, 'cup').map((m) => m.id),
    ['league'],
  )
  assert.deepEqual(
    leagueStageMatches(matches, 'other').map((m) => m.id),
    [],
  )
})

test('participants without recorded games in a table are not placed in it', () => {
  const eli = player('p-eli', 'Eli')
  const matches = [game('group-a', ana, beto, 1, 0, 'GROUP', 'g-a')]
  const rows = calculatePlayerStandings(groupStageMatches(matches, 'g-a'), [
    ...participants,
    participant(eli, teamVerde),
  ])
  assert.deepEqual(
    rows.map((row) => row.playerId),
    ['p-ana', 'p-beto'],
  )
})

test('rows show the assigned team, falling back to the match team only without a participant', () => {
  const matches = [game('group-a', ana, beto, 1, 0, 'GROUP', 'g-a')]
  const withParticipants = calculatePlayerStandings(matches, participants)
  assert.equal(withParticipants[0].teamName, 'Rojo FC')
  assert.equal(withParticipants[1].teamName, 'Azul FC')
  const withoutParticipants = calculatePlayerStandings(matches, [])
  assert.equal(withoutParticipants[0].teamName, 'Rojo FC')
})
