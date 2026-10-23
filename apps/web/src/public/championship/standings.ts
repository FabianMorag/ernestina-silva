import type { Match, Participant } from '../../shared/tournament-api.ts'

export type PlayerStandingRow = {
  playerId: string
  playerName: string
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

// Only matches explicitly recorded in a group stage with this group ID count.
export function groupStageMatches(matches: Match[], groupId: string): Match[] {
  return matches.filter(
    (match) => match.stage?.kind === 'GROUP' && match.group?.id === groupId,
  )
}

// League matches for a championship; unassigned or knockout matches never count.
export function leagueStageMatches(
  matches: Match[],
  championshipId: string,
): Match[] {
  return matches.filter(
    (match) =>
      match.stage?.kind === 'LEAGUE' &&
      match.championship.id === championshipId,
  )
}

type Accumulator = PlayerStandingRow

function emptyRow(
  playerId: string,
  playerName: string,
  teamName: string,
): Accumulator {
  return {
    playerId,
    playerName,
    teamName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }
}

function applyResult(row: Accumulator, goalsFor: number, goalsAgainst: number) {
  row.played += 1
  row.goalsFor += goalsFor
  row.goalsAgainst += goalsAgainst
  row.goalDifference = row.goalsFor - row.goalsAgainst
  if (goalsFor > goalsAgainst) {
    row.wins += 1
    row.points += 3
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1
    row.points += 1
  } else {
    row.losses += 1
  }
}

/**
 * Player standings for the given matches only. Rows exist solely for players
 * with at least one recorded match, so unplayed participants are not placed.
 * The team shown is the participant's assigned team; the match team is used
 * only when no participant record exists.
 */
export function calculatePlayerStandings(
  matches: Match[],
  participants: Participant[],
): PlayerStandingRow[] {
  const teamByPlayer = new Map(
    participants.map((participant) => [
      participant.playerId,
      participant.team.name,
    ]),
  )
  const rows = new Map<string, Accumulator>()

  const rowFor = (
    playerId: string,
    playerName: string,
    matchTeamName: string,
  ): Accumulator => {
    let row = rows.get(playerId)
    if (!row) {
      row = emptyRow(
        playerId,
        playerName,
        teamByPlayer.get(playerId) ?? matchTeamName,
      )
      rows.set(playerId, row)
    }
    return row
  }

  for (const match of matches) {
    const home = rowFor(
      match.homePlayer.id,
      match.homePlayer.name,
      match.homeTeam.name,
    )
    const away = rowFor(
      match.awayPlayer.id,
      match.awayPlayer.name,
      match.awayTeam.name,
    )
    applyResult(home, match.homeScore, match.awayScore)
    applyResult(away, match.awayScore, match.homeScore)
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.playerName.localeCompare(b.playerName) ||
      a.playerId.localeCompare(b.playerId),
  )
}
