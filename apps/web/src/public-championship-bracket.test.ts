import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildKnockoutBracket } from './public-championship/bracket.ts'
import type { Match } from './tournament-api.ts'

const team: { id: string; name: string } = { id: 't', name: 'Equipo' }

function knockout(
  id: string,
  round: number | null,
  slot: number | null,
  homeName = `Local ${id}`,
  awayName = `Visita ${id}`,
): Match {
  return {
    id,
    homeScore: 2,
    awayScore: 1,
    homePlayer: { id: `h-${id}`, name: homeName },
    awayPlayer: { id: `a-${id}`, name: awayName },
    homeTeam: team,
    awayTeam: team,
    championship: { id: 'cup', name: 'Copa' },
    stage: { id: 'stage-k', kind: 'KNOCKOUT', championshipId: 'cup' },
    group: null,
    knockoutRound: round,
    knockoutSlot: slot,
  }
}

test('places only recorded round and slot values, in round order', () => {
  const bracket = buildKnockoutBracket([
    knockout('final', 2, 1),
    knockout('semi-2', 4, 2),
    knockout('semi-1', 4, 1),
  ])
  assert.deepEqual(
    bracket.rounds.map((round) => [round.round, round.label]),
    [
      [4, 'Semifinales'],
      [2, 'Final'],
    ],
  )
  assert.deepEqual(
    bracket.rounds[0].slots.map((slot) => [slot.slot, slot.match?.id ?? null]),
    [
      [1, 'semi-1'],
      [2, 'semi-2'],
    ],
  )
  assert.deepEqual(
    bracket.rounds[1].slots.map((slot) => slot.slot),
    [1],
  )
})

test('sparse rounds leave unrecorded slots empty instead of inferring them', () => {
  const bracket = buildKnockoutBracket([knockout('quarter-3', 8, 3)])
  assert.equal(bracket.rounds.length, 1)
  assert.equal(bracket.rounds[0].round, 8)
  // Quarterfinals have 4 slots; only slot 3 is recorded.
  assert.deepEqual(
    bracket.rounds[0].slots.map((slot) => [slot.slot, slot.match?.id ?? null]),
    [
      [1, null],
      [2, null],
      [3, 'quarter-3'],
      [4, null],
    ],
  )
  assert.equal(bracket.champion, null)
})

test('never invents a winner, progression or champion', () => {
  const bracket = buildKnockoutBracket([knockout('final', 2, 1)])
  assert.equal(bracket.champion, null)
  assert.equal(bracket.rounds[0].slots[0].match?.id, 'final')
})

test('legacy knockout matches without placement are kept separately', () => {
  const legacy = knockout('legacy', null, null)
  const bracket = buildKnockoutBracket([legacy, knockout('final', 2, 1)])
  assert.deepEqual(
    bracket.unplaced.map((match) => match.id),
    ['legacy'],
  )
  assert.deepEqual(
    bracket.rounds
      .flatMap((round) => round.slots.map((slot) => slot.match?.id ?? null))
      .filter(Boolean),
    ['final'],
  )
})

test('non-knockout matches and invalid placements are excluded from the bracket', () => {
  const groupMatch: Match = {
    ...knockout('group', 2, 1),
    stage: { id: 'stage-g', kind: 'GROUP', championshipId: 'cup' },
    group: { id: 'g-a', stageId: 'stage-g', name: 'A' },
  }
  const bracket = buildKnockoutBracket([
    groupMatch,
    knockout('bad-round', 3, 1),
    knockout('bad-slot', 2, 9),
  ])
  assert.deepEqual(bracket.rounds, [])
  assert.deepEqual(
    bracket.unplaced.map((match) => match.id),
    ['bad-round', 'bad-slot'],
  )
})

test('returns an empty bracket when there are no knockout matches', () => {
  assert.deepEqual(buildKnockoutBracket([]), {
    rounds: [],
    unplaced: [],
    champion: null,
  })
})
