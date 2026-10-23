import type { Item, Match } from '../../shared/tournament-api.ts'

export type HomeSummary = {
  championshipCount: number
  matchCount: number
  // Most recently RECORDED match, not the most recent kick-off: the public
  // match payload exposes no date, and `GET /tournament/matches` is ordered by
  // `createdAt desc`, so the first item is the newest record.
  latestRecordedMatch: Match | null
  latestChampionship: Item | null
}

/**
 * Facts for the public home, derived only from data the public API already
 * exposes. There is no championship status and no match date in the public
 * payload, so this never reports an in-progress championship or a fixture.
 */
export function summarizeHome(
  championships: Item[],
  matches: Match[],
): HomeSummary {
  const latestRecordedMatch = matches[0] ?? null
  return {
    championshipCount: championships.length,
    matchCount: matches.length,
    latestRecordedMatch,
    latestChampionship: latestRecordedMatch?.championship ?? null,
  }
}

/**
 * Home subtitle, e.g. `2 campeonatos · 15 partidos registrados`. It states only
 * recorded totals: the public payload has no championship status and no match
 * date, so this never says a championship is in progress or a fixture was
 * played (S3).
 */
export function homeTotalsLine(summary: HomeSummary): string {
  const championships =
    summary.championshipCount === 1
      ? '1 campeonato'
      : `${summary.championshipCount} campeonatos`
  const matches =
    summary.matchCount === 1
      ? '1 partido registrado'
      : `${summary.matchCount} partidos registrados`
  return `${championships} · ${matches}`
}
