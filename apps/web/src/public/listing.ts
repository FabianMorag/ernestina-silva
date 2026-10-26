export const publicListingLabel = 'Lista de campeonatos'

/** Championship count chip; zero keeps the Spanish plural. */
export function publicCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'CAMPEONATO' : 'CAMPEONATOS'}`
}
