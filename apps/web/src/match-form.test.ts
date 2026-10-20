import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resetMatchFormKeepingContext } from './match-form.ts'

test('resetting a match keeps its championship and stage but clears the next result', () => {
  const controls = {
    championshipId: { value: 'cup' },
    stageId: { value: 'semifinal' },
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
  assert.equal(controls.homePlayerId.value, '')
  assert.equal(controls.awayPlayerId.value, '')
  assert.equal(controls.homeScore.value, '')
  assert.equal(controls.awayScore.value, '')
})
