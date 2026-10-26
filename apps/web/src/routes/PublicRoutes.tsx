import { Navigate } from 'react-router'
import { PublicPage } from '../public/PublicPage.tsx'

export function HomeRoute() {
  return <PublicPage page="home" />
}

export function PublicMatchesRoute() {
  return <Navigate to="/estadisticas" replace />
}

export function PublicStatisticsRoute() {
  return <PublicPage page="statistics" />
}

export function PublicChampionshipsRoute() {
  return <PublicPage page="championships" />
}

export function PublicNotFoundRoute() {
  return <PublicPage page="not-found" />
}
