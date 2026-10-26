import type { Championship, Item, Match } from '../../shared/tournament-api.ts'
import {
  calculatePlayerStandings,
  type PlayerStandingRow,
} from '../championship/standings.ts'

export type PlayerStatistics = {
  copaAmerica: PlayerStandingRow[]
  worldCup: PlayerStandingRow[]
  general: PlayerStandingRow[]
}

export function playerStatistics(
  matches: Match[],
  championships: Championship[],
  players: Item[],
): PlayerStatistics {
  const typeByChampionship = new Map(
    championships.map((championship) => [championship.id, championship.type]),
  )
  const withUnplayed = (rows: PlayerStandingRow[]): PlayerStandingRow[] => {
    const playedIds = new Set(rows.map((row) => row.playerId))
    const unplayed = players
      .filter((player) => !playedIds.has(player.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((player) => ({
        playerId: player.id,
        playerName: player.name,
        teamName: '',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }))
    return [...rows, ...unplayed]
  }
  const forType = (type: Championship['type']) =>
    withUnplayed(
      calculatePlayerStandings(
        matches.filter(
          (match) => typeByChampionship.get(match.championship.id) === type,
        ),
        [],
      ),
    )

  return {
    copaAmerica: forType('COPA_AMERICA'),
    worldCup: forType('WORLD_CUP'),
    general: withUnplayed(calculatePlayerStandings(matches, [])),
  }
}

export function performancePercentage(row: PlayerStandingRow): number {
  if (row.played === 0) return 0
  return Math.round((row.points / (row.played * 3)) * 1000) / 10
}
