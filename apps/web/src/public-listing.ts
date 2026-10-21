export type PublicListing = 'championships' | 'matches'

const UNITS: Record<PublicListing, { singular: string; plural: string }> = {
  championships: { singular: 'CAMPEONATO', plural: 'CAMPEONATOS' },
  matches: { singular: 'PARTIDO', plural: 'PARTIDOS' },
}

/** Accessible name for a public listing section. */
export function publicListingLabel(listing: PublicListing): string {
  return listing === 'championships'
    ? 'Lista de campeonatos'
    : 'Partidos registrados'
}

/** Count chip, e.g. `15 PARTIDOS`. Zero keeps the Spanish plural. */
export function publicCountLabel(
  listing: PublicListing,
  count: number,
): string {
  const unit = UNITS[listing]
  return `${count} ${count === 1 ? unit.singular : unit.plural}`
}
