export type Page = 'home' | 'matches' | 'championships' | 'admin' | 'not-found'

export function pageForPath(pathname: string): Page {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin') return 'admin'
  if (path === '/') return 'home'
  if (path === '/partidos') return 'matches'
  if (path === '/campeonatos') return 'championships'
  return 'not-found'
}
