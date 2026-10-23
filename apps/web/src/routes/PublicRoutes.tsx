import { PublicPage } from '../public/PublicPage.tsx'

export function HomeRoute() {
  return <PublicPage page="home" />
}

export function PublicMatchesRoute() {
  return <PublicPage page="matches" />
}

export function PublicChampionshipsRoute() {
  return <PublicPage page="championships" />
}

export function PublicNotFoundRoute() {
  return <PublicPage page="not-found" />
}
