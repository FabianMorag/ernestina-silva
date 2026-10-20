import assert from 'node:assert/strict'
import { test } from 'node:test'
import { championshipSummaries, matchesForChampionship } from './championships.ts'
import type { Item, Match, Stage } from './tournament-api.ts'

const championships: Item[] = [{ id: 'cup', name: 'Copa Ernestina' }, { id: 'league', name: 'Liga' }]
const stages: Stage[] = [{ id: 'groups', name: 'Grupos A', kind: 'GROUP', championshipId: 'cup' }]
const matches = [
  { id: 'match-1', championship: championships[0] },
  { id: 'match-2', championship: championships[1] },
] as Match[]

test('home championships use persisted names, stages and match counts only', () => {
  assert.deepEqual(championshipSummaries(championships, matches, stages), [
    { id: 'cup', name: 'Copa Ernestina', matchCount: 1, stages: [stages[0]] },
    { id: 'league', name: 'Liga', matchCount: 1, stages: [] },
  ])
})

test('a championship action shows only its matches', () => {
  assert.deepEqual(matchesForChampionship(matches, 'cup'), [matches[0]])
  assert.deepEqual(matchesForChampionship(matches, 'missing'), [])
  assert.deepEqual(matchesForChampionship(matches, null), matches)
})
