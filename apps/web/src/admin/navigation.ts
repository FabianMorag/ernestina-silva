import type { Participant, Player } from '../shared/tournament-api.ts'

export type AdminPage =
  'players' | 'teams' | 'championships' | 'matches' | 'not-found'

export function rosterForChampionship(
  participants: Participant[],
  championshipId: string,
): Participant[] {
  return participants.filter((entry) => entry.championshipId === championshipId)
}

export function unassignedPlayers(
  players: Player[],
  participants: Participant[],
  championshipId: string,
): Player[] {
  const assignedIds = new Set(
    rosterForChampionship(participants, championshipId).map(
      (entry) => entry.playerId,
    ),
  )
  return players.filter((player) => !assignedIds.has(player.id))
}
