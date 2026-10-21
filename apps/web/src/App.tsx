import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router'
import {
  AdminChampionshipsRoute,
  AdminChampionshipsNewRoute,
  AdminChampionshipDetailRoute,
  AdminMatchesRoute,
  AdminNotFoundRoute,
  AdminPlayersRoute,
  AdminTeamsRoute,
} from './routes/AdminRoutes.tsx'
import {
  HomeRoute,
  PublicChampionshipDetailRoute,
  PublicChampionshipsRoute,
  PublicMatchesRoute,
  PublicNotFoundRoute,
} from './routes/PublicRoutes.tsx'
import { routeTable, type RouteId } from './routes.ts'

const routeComponents: Record<RouteId, ComponentType> = {
  home: HomeRoute,
  publicMatches: PublicMatchesRoute,
  publicChampionships: PublicChampionshipsRoute,
  publicChampionshipDetail: PublicChampionshipDetailRoute,
  adminChampionships: AdminChampionshipsRoute,
  adminChampionshipsNew: AdminChampionshipsNewRoute,
  adminChampionshipDetail: AdminChampionshipDetailRoute,
  adminPlayers: AdminPlayersRoute,
  adminTeams: AdminTeamsRoute,
  adminMatches: AdminMatchesRoute,
  adminNotFound: AdminNotFoundRoute,
  publicNotFound: PublicNotFoundRoute,
}

function App() {
  return (
    <Routes>
      {routeTable.map(({ id, path }) => {
        const RouteComponent = routeComponents[id]
        return (
          <Route
            key={`${id}:${path}`}
            path={path}
            element={<RouteComponent />}
          />
        )
      })}
    </Routes>
  )
}

export default App
