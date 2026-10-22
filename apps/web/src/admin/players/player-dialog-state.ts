import type { Player } from '../../tournament-api.ts'

export type PlayerDialogAction =
  { type: 'create' } | { type: 'edit'; player: Player } | { type: 'close' }

export function playerDialogState(action: PlayerDialogAction) {
  if (action.type === 'edit') return { player: action.player, open: true }
  if (action.type === 'create') return { player: undefined, open: true }
  return { player: undefined, open: false }
}
