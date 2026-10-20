export type Item = { id: string; name: string }
export type Player = Item & { title: string | null }
export type Participant = {
  id: string
  championshipId: string
  playerId: string
  teamId: string
  player: Player
  team: Item
}
export type Stage = Item & {
  kind: 'GROUP' | 'LEAGUE' | 'KNOCKOUT'
  championshipId: string
}
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

export function stageLabel(kind: Stage['kind']): string {
  return { GROUP: 'Grupos', LEAGUE: 'Liga', KNOCKOUT: 'Eliminación directa' }[
    kind
  ]
}
