import assert from 'node:assert/strict'
import { test } from 'node:test'
import { homeTotalsLine, summarizeHome } from './summary.ts'
import type { Item, Match } from '../../shared/tournament-api.ts'

const cup: Item = { id: 'cup', name: 'Copa' }
const league: Item = { id: 'league', name: 'Liga' }

function recordedMatch(id: string, championship: Item): Match {
  return {
    id,
    homeScore: 2,
    awayScore: 1,
    homePlayer: { id: 'p1', name: 'Anito' },
    awayPlayer: { id: 'p2', name: 'Carrasco' },
    homeTeam: { id: 't1', name: 'Portugal' },
    awayTeam: { id: 't2', name: 'Inglaterra' },
    championship,
    stage: null,
    group: null,
    knockoutRound: null,
    knockoutSlot: null,
  }
}

test('totals come from the loaded public collections', () => {
  const summary = summarizeHome([cup, league], [recordedMatch('m1', cup)])
  assert.equal(summary.championshipCount, 2)
  assert.equal(summary.matchCount, 1)
})

test('the latest recorded match is the first item, matching the API createdAt-desc order', () => {
  const first = recordedMatch('newest', cup)
  const summary = summarizeHome(
    [cup, league],
    [first, recordedMatch('older', league)],
  )
  assert.equal(summary.latestRecordedMatch?.id, 'newest')
  assert.equal(summary.latestChampionship?.id, 'cup')
})

test('an empty match list yields no latest match and no latest championship', () => {
  const summary = summarizeHome([cup, league], [])
  assert.equal(summary.latestRecordedMatch, null)
  assert.equal(summary.latestChampionship, null)
  assert.equal(summary.matchCount, 0)
  assert.equal(summary.championshipCount, 2)
})

test('no data at all still produces zeroed totals instead of failing', () => {
  assert.deepEqual(summarizeHome([], []), {
    championshipCount: 0,
    matchCount: 0,
    latestRecordedMatch: null,
    latestChampionship: null,
  })
})

test('the totals line counts both collections in Spanish', () => {
  assert.equal(
    homeTotalsLine(summarizeHome([cup, league], [recordedMatch('m1', cup)])),
    '2 campeonatos · 1 partido registrado',
  )
  assert.equal(
    homeTotalsLine(summarizeHome([cup], [])),
    '1 campeonato · 0 partidos registrados',
  )
})

test('the totals line never claims a status or a played fixture (S3)', () => {
  const line = homeTotalsLine(
    summarizeHome([cup, league], [recordedMatch('m1', cup)]),
  )
  assert.doesNotMatch(line, /jugad|en curso|programad|finalizad|disputad/i)
})
