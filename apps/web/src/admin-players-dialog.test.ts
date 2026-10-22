import assert from 'node:assert/strict'
import { test } from 'node:test'
import { playerDialogState } from './admin/players/player-dialog-state.ts'

test('opening the add-player dialog opens an empty form', () => {
  assert.deepEqual(playerDialogState({ type: 'create' }), {
    player: undefined,
    open: true,
  })
})

test('editing a player keeps that player in the open dialog state', () => {
  const player = { id: 'one', name: 'Carrasco', title: null }
  assert.deepEqual(playerDialogState({ type: 'edit', player }), {
    player,
    open: true,
  })
})

test('closing the player dialog clears its selection', () => {
  assert.deepEqual(playerDialogState({ type: 'close' }), {
    player: undefined,
    open: false,
  })
})
