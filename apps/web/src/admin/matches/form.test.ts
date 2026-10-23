import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resetMatchFormKeepingContext } from './form.ts'

test('resetting a match keeps its championship, stage and group but clears the next result', () => {
  const controls = {
    championshipId: { value: 'cup' },
    stageId: { value: 'semifinal' },
    groupId: { value: 'group-a' },
    homePlayerId: { value: 'home' },
    awayPlayerId: { value: 'away' },
    homeScore: { value: '2' },
    awayScore: { value: '1' },
  }
  const form = {
    elements: {
      namedItem: (name: string) =>
        controls[name as keyof typeof controls] ?? null,
    },
    reset: () => {
      Object.values(controls).forEach((control) => {
        control.value = ''
      })
    },
  } as unknown as HTMLFormElement

  resetMatchFormKeepingContext(form)

  assert.equal(controls.championshipId.value, 'cup')
  assert.equal(controls.stageId.value, 'semifinal')
  assert.equal(controls.groupId.value, 'group-a')
  assert.equal(controls.homePlayerId.value, '')
  assert.equal(controls.awayPlayerId.value, '')
  assert.equal(controls.homeScore.value, '')
  assert.equal(controls.awayScore.value, '')
})

test('resetting a knockout match keeps its round and pairing position', () => {
  const controls = {
    championshipId: { value: 'cup' },
    stageId: { value: 'knockout' },
    knockoutRound: { value: '8' },
    knockoutSlot: { value: '2' },
    homePlayerId: { value: 'home' },
    awayPlayerId: { value: 'away' },
    homeScore: { value: '2' },
    awayScore: { value: '1' },
  }
  const form = {
    elements: {
      namedItem: (name: string) =>
        controls[name as keyof typeof controls] ?? null,
    },
    reset: () =>
      Object.values(controls).forEach((control) => {
        control.value = ''
      }),
  } as unknown as HTMLFormElement

  resetMatchFormKeepingContext(form)

  assert.equal(controls.knockoutRound.value, '8')
  assert.equal(controls.knockoutSlot.value, '2')
  assert.equal(controls.homePlayerId.value, '')
  assert.equal(controls.homeScore.value, '')
})
