import { AdminPage } from '../admin/AdminPage.tsx'
import { Navigate, useSearchParams } from 'react-router'

export function AdminChampionshipsRoute() {
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('campeonato')
  if (selectedId)
    return (
      <Navigate
        to={`/admin/campeonatos/${encodeURIComponent(selectedId)}`}
        replace
      />
    )
  return <AdminPage page="championships" championshipView="list" />
}

export function AdminChampionshipsNewRoute() {
  return <AdminPage page="championships" championshipView="create" />
}

export function AdminChampionshipDetailRoute() {
  return <AdminPage page="championships" championshipView="detail" />
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
