import assert from 'node:assert/strict'
import { test } from 'node:test'
import { groupMatchesByStage } from './match-sections.ts'
import type { Match, Stage, StageGroup } from './tournament-api.ts'

const group: StageGroup = { id: 'group-b', stageId: 'groups', name: 'B' }
const groupA: StageGroup = { id: 'group-a', stageId: 'groups', name: 'A' }

const stages = {
  groups: { id: 'groups', kind: 'GROUP', championshipId: 'cup' } as Stage,
  league: { id: 'league', kind: 'LEAGUE', championshipId: 'cup' } as Stage,
  knockout: {
    id: 'knockout',
    kind: 'KNOCKOUT',
    championshipId: 'cup',
  } as Stage,
}

function match(id: string, overrides: Partial<Match> = {}): Match {
  return {
    id,
    homeScore: 0,
    awayScore: 0,
    homePlayer: { id: 'p1', name: 'Anito' },
    awayPlayer: { id: 'p2', name: 'Borito' },
    homeTeam: { id: 't1', name: 'Portugal' },
    awayTeam: { id: 't2', name: 'Francia' },
    championship: { id: 'cup', name: 'Copa América 2024' },
    stage: null,
    group: null,
    knockoutRound: null,
    knockoutSlot: null,
    ...overrides,
  }
}

test('sections distinguish each group and knockout round, order stages, and leave unstaged matches last', () => {
  const sections = groupMatchesByStage([
    match('unstaged'),
    match('final', {
      stage: stages.knockout,
      knockoutRound: 2,
      knockoutSlot: 1,
    }),
    match('semi-1', {
      stage: stages.knockout,
      knockoutRound: 4,
      knockoutSlot: 1,
    }),
    match('league', { stage: stages.league }),
    match('group-b', { stage: stages.groups, group }),
    match('semi-2', {
      stage: stages.knockout,
      knockoutRound: 4,
      knockoutSlot: 2,
    }),
    match('group-a', { stage: stages.groups, group: groupA }),
  ])

  assert.deepEqual(
    sections.map((section) => section.title),
    ['Grupo A', 'Grupo B', 'Liga', 'Semifinales', 'Final', 'Sin etapa'],
  )
})

test('each group is a separate section in alphabetical order', () => {
  const sections = groupMatchesByStage([
    match('b', { stage: stages.groups, group }),
    match('a', { stage: stages.groups, group: groupA }),
  ])

  assert.deepEqual(
    sections.map((section) => [
      section.title,
      section.matches.map((item) => item.id),
    ]),
    [
      ['Grupo A', ['a']],
      ['Grupo B', ['b']],
    ],
  )
})

test('knockout rounds are separate sections in bracket order, with matches by slot', () => {
  const sections = groupMatchesByStage([
    match('final', {
      stage: stages.knockout,
      knockoutRound: 2,
      knockoutSlot: 1,
    }),
    match('semi-2', {
      stage: stages.knockout,
      knockoutRound: 4,
      knockoutSlot: 2,
    }),
    match('semi-1', {
      stage: stages.knockout,
      knockoutRound: 4,
      knockoutSlot: 1,
    }),
  ])

  assert.deepEqual(
    sections.map((section) => [
      section.title,
      section.matches.map((item) => item.id),
    ]),
    [
      ['Semifinales', ['semi-1', 'semi-2']],
      ['Final', ['final']],
    ],
  )
})
