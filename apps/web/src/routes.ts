import { matchRoutes } from 'react-router'

export type RouteId =
  | 'home'
  | 'publicMatches'
  | 'publicChampionships'
  | 'adminChampionships'
  | 'adminPlayers'
  | 'adminTeams'
  | 'adminMatches'
  | 'adminNotFound'
  | 'publicNotFound'

export type Area = 'public' | 'admin'
export type RoutePage =
  'home' | 'matches' | 'championships' | 'players' | 'teams' | 'not-found'
export type ResolvedRoute = { id: RouteId; area: Area; page: RoutePage }

type RouteEntry = ResolvedRoute & { path: string }

// Single source of truth for the URLs of the web app. Specific paths come
// first; react-router ranks matches by specificity, so order is not critical.
export const routeTable: RouteEntry[] = [
  { id: 'home', path: '/', area: 'public', page: 'home' },
  {
    id: 'publicMatches',
    path: '/partidos',
    area: 'public',
    page: 'matches',
  },
  {
    id: 'publicChampionships',
    path: '/campeonatos',
    area: 'public',
    page: 'championships',
  },
  {
    id: 'adminChampionships',
    path: '/admin',
    area: 'admin',
    page: 'championships',
  },
  {
    id: 'adminChampionships',
    path: '/admin/campeonatos',
    area: 'admin',
    page: 'championships',
  },
  {
    id: 'adminPlayers',
    path: '/admin/jugadores',
    area: 'admin',
    page: 'players',
  },
  { id: 'adminTeams', path: '/admin/equipos', area: 'admin', page: 'teams' },
  {
    id: 'adminMatches',
    path: '/admin/partidos',
    area: 'admin',
    page: 'matches',
  },
  { id: 'adminNotFound', path: '/admin/*', area: 'admin', page: 'not-found' },
  { id: 'publicNotFound', path: '*', area: 'public', page: 'not-found' },
]

export function resolveRoute(pathname: string): ResolvedRoute {
  const match = matchRoutes(routeTable, pathname)?.at(-1)
  if (!match) return { id: 'publicNotFound', area: 'public', page: 'not-found' }
  const { id, area, page } = match.route
  return { id, area, page }
}

export function withChampionshipParam(
  searchParams: URLSearchParams,
  championshipId: string,
): URLSearchParams {
  const nextSearchParams = new URLSearchParams(searchParams)
  if (championshipId) nextSearchParams.set('campeonato', championshipId)
  else nextSearchParams.delete('campeonato')
  return nextSearchParams
}

// Keep the current App consumer compatible until the Router integration lands.
export type Page = 'home' | 'matches' | 'championships' | 'admin' | 'not-found'

export function pageForPath(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin') return 'admin'
  if (path === '/') return 'home'
  if (path === '/partidos') return 'matches'
  if (path === '/campeonatos') return 'championships'
  return 'not-found'
}
