import { lazy, Suspense, type ComponentType } from 'react'
import { Route, Routes } from 'react-router'
import {
  HomeRoute,
  PublicChampionshipsRoute,
  PublicMatchesRoute,
  PublicStatisticsRoute,
  PublicNotFoundRoute,
} from './routes/PublicRoutes.tsx'
import { routeTable, type RouteId } from './routes/route-table.ts'

function lazyAdminRoute(name: keyof typeof import('./routes/AdminRoutes.tsx')) {
  return lazy(() =>
    import('./routes/AdminRoutes.tsx').then((routes) => ({
      default: routes[name],
    })),
  )
}

const AdminChampionshipsRoute = lazyAdminRoute('AdminChampionshipsRoute')
const AdminChampionshipsNewRoute = lazyAdminRoute('AdminChampionshipsNewRoute')
const AdminChampionshipDetailRoute = lazyAdminRoute(
  'AdminChampionshipDetailRoute',
)
const AdminPlayersRoute = lazyAdminRoute('AdminPlayersRoute')
const AdminTeamsRoute = lazyAdminRoute('AdminTeamsRoute')
const AdminMatchesRoute = lazyAdminRoute('AdminMatchesRoute')
const AdminNotFoundRoute = lazyAdminRoute('AdminNotFoundRoute')
const PublicChampionshipDetailRoute = lazy(() =>
  import('./public/championship/ChampionshipDetail.tsx').then((module) => ({
    default: module.PublicChampionshipDetail,
  })),
)

const routeComponents: Record<RouteId, ComponentType> = {
  home: HomeRoute,
  publicMatches: PublicMatchesRoute,
  publicStatistics: PublicStatisticsRoute,
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
    <Suspense
      fallback={
        <main
          className="bg-base-200 text-base-content grid min-h-screen place-items-center"
          role="status"
        >
          Cargando página…
        </main>
      }
    >
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
    </Suspense>
  )
}

export default App
