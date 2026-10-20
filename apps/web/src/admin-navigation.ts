import type { Participant, Player } from './tournament-api.ts'

export type AdminPage =
  'players' | 'teams' | 'championships' | 'matches' | 'not-found'

export function adminPageForPath(pathname: string): AdminPage | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin' || path === '/admin/campeonatos') return 'championships'
  if (path === '/admin/jugadores') return 'players'
  if (path === '/admin/equipos') return 'teams'
  if (path === '/admin/partidos') return 'matches'
  return path.startsWith('/admin/') ? 'not-found' : null
}

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
