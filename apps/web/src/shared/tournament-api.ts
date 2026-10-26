export type Item = { id: string; name: string }
export type ChampionshipType = 'COPA_AMERICA' | 'WORLD_CUP'
export type Championship = Item & { type: ChampionshipType }

export function championshipTypeLabel(type: ChampionshipType): string {
  return type === 'COPA_AMERICA' ? 'Copa América' : 'Mundial'
}
export type Player = Item & { title: string | null }
export type Participant = {
  id: string
  championshipId: string
  playerId: string
  teamId: string
  player: Player
  team: Item
}
export type Stage = {
  id: string
  kind: 'GROUP' | 'LEAGUE' | 'KNOCKOUT'
  championshipId: string
}
export type StageGroup = { id: string; stageId: string; name: string }
export type Match = {
  id: string
  homeScore: number
  awayScore: number
  homePlayer: Item
  awayPlayer: Item
  homeTeam: Item
  awayTeam: Item
  championship: Item
  stage: Stage | null
  group: StageGroup | null
  knockoutRound: number | null
  knockoutSlot: number | null
}

export const KNOCKOUT_ROUNDS = [64, 32, 16, 8, 4, 2] as const

export function knockoutRoundLabel(round: number): string {
  const labels: Record<number, string> = {
    64: 'Ronda de 64',
    32: 'Ronda de 32',
    16: 'Octavos de final',
    8: 'Cuartos de final',
    4: 'Semifinales',
    2: 'Final',
  }
  return labels[round] ?? `Ronda de ${round}`
}

export function knockoutSlots(round: number): number[] {
  if (!KNOCKOUT_ROUNDS.some((value) => value === round)) return []
  return Array.from({ length: round / 2 }, (_, index) => index + 1)
}

export function groupsForStage(
  groups: StageGroup[],
  stageId: string,
): StageGroup[] {
  return groups.filter((group) => group.stageId === stageId)
}

export async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    throw new Error('No pudimos completar la solicitud. Intenta nuevamente.')
  }
  return response.json() as Promise<T>
}

export async function patchRequest<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok)
    throw new Error('No pudimos completar la solicitud. Intenta nuevamente.')
  return response.json() as Promise<T>
}

export async function deleteRequest<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!response.ok)
    throw new Error('No pudimos completar la solicitud. Intenta nuevamente.')
  return response.json() as Promise<T>
}

export function stageLabel(kind: Stage['kind']): string {
  return { GROUP: 'Grupos', LEAGUE: 'Liga', KNOCKOUT: 'Eliminación directa' }[
    kind
  ]
}
