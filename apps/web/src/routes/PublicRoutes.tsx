import { PublicPage } from '../PublicPage.tsx'
import { PublicChampionshipDetail } from '../public-championship/ChampionshipDetail.tsx'

export function HomeRoute() {
  return <PublicPage page="home" />
}

export function PublicMatchesRoute() {
  return <PublicPage page="matches" />
}

export function PublicChampionshipsRoute() {
  return <PublicPage page="championships" />
}

export function PublicChampionshipDetailRoute() {
  return <PublicChampionshipDetail />
}

export function PublicNotFoundRoute() {
  return <PublicPage page="not-found" />
}
