import type { Item, Match, Stage } from './tournament-api.ts'

export type ChampionshipSummary = Item & { matchCount: number; stages: Stage[] }

export function championshipSummaries(
  championships: Item[],
  matches: Match[],
  stages: Stage[],
): ChampionshipSummary[] {
  return championships.map((championship) => ({
    ...championship,
    matchCount: matches.filter(
      (match) => match.championship.id === championship.id,
    ).length,
    stages: stages.filter((stage) => stage.championshipId === championship.id),
  }))
}

export function matchesForChampionship(
  matches: Match[],
  championshipId: string | null,
): Match[] {
  return championshipId
    ? matches.filter((match) => match.championship.id === championshipId)
    : matches
}
