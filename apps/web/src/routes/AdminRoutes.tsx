import { AdminPage } from '../AdminPage.tsx'

export function AdminChampionshipsRoute() {
  return <AdminPage page="championships" />
}

export function AdminPlayersRoute() {
  return <AdminPage page="players" />
}

export function AdminTeamsRoute() {
  return <AdminPage page="teams" />
}

export function AdminMatchesRoute() {
  return <AdminPage page="matches" />
}

export function AdminNotFoundRoute() {
  return <AdminPage page="not-found" />
}
