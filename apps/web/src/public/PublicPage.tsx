import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Swords,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router'
import useSWR from 'swr'
import { HomeView } from './home/HomeView.tsx'
import { StatisticsView } from './statistics/StatisticsView.tsx'
import {
  championshipDetailPath,
  championshipSummaries,
  type ChampionshipSummary,
} from './championships.ts'
import { publicCountLabel, publicListingLabel } from './listing.ts'
import {
  request,
  stageLabel,
  type Championship,
  type Match,
  type Player,
  type Stage,
} from '../shared/tournament-api.ts'
import './public.css'

type PublicRoute = 'home' | 'statistics' | 'championships' | 'not-found'

function ChampionshipList({
  championships,
}: {
  championships: ChampionshipSummary[]
}) {
  if (!championships.length) {
    return (
      <div className="public-empty">
        <Trophy aria-hidden="true" />
        <p>Todavía no hay campeonatos registrados.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {championships.map((championship, index) => (
        <article className="championship-row" key={championship.id}>
          <div className="championship-symbol" aria-hidden="true">
            <Trophy />
          </div>
          <div className="championship-copy">
            <span className="championship-index">
              CAMPEONATO {String(index + 1).padStart(2, '0')}
            </span>
            <h3>{championship.name}</h3>
            <div className="championship-meta">
              <span>
                <Swords aria-hidden="true" /> {championship.matchCount}{' '}
                {championship.matchCount === 1 ? 'partido' : 'partidos'}
              </span>
              {championship.stages.length > 0 && (
                <span>
                  <CalendarDays aria-hidden="true" />{' '}
                  {championship.stages
                    .map((stage) => stageLabel(stage.kind))
                    .join(' / ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 [@media(max-width:760px)]:justify-start">
            <Link
              className="public-action"
              to={championshipDetailPath(championship.id)}
              aria-label={`Ver detalle de ${championship.name}`}
            >
              Ver detalle <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PublicPage({ page }: { page: PublicRoute }) {
  const {
    data: matches = [],
    error: matchesError,
    isLoading: matchesLoading,
  } = useSWR<Match[]>('/tournament/matches', request)
  const {
    data: championships = [],
    error: championshipsError,
    isLoading: championshipsLoading,
  } = useSWR<Championship[]>('/tournament/championships', request)
  const {
    data: stages = [],
    error: stagesError,
    isLoading: stagesLoading,
  } = useSWR<Stage[]>(
    page === 'championships' ? '/tournament/stages' : null,
    request,
  )
  const {
    data: players = [],
    error: playersError,
    isLoading: playersLoading,
  } = useSWR<Player[]>(
    page === 'statistics' ? '/tournament/players' : null,
    request,
  )
  const error = matchesError || championshipsError || stagesError
  const loading = matchesLoading || championshipsLoading || stagesLoading
  const summaries = championshipSummaries(championships, matches, stages)

  return (
    <main className="public-shell">
      <header className="public-header">
        <div className="public-container flex min-h-[88px] items-center justify-between gap-8 [@media(max-width:760px)]:flex-col [@media(max-width:760px)]:items-start [@media(max-width:760px)]:gap-3 [@media(max-width:760px)]:py-4">
          <Link to="/" className="public-brand">
            <span className="public-brand-mark">
              <Trophy aria-hidden="true" />
            </span>
            <span>
              <small>CAMPEONATO DE FIFA</small>
              <strong>Ernestina Silva</strong>
            </span>
          </Link>
          <nav aria-label="Navegación principal" className="public-nav">
            <Link aria-current={page === 'home' ? 'page' : undefined} to="/">
              Inicio
            </Link>
            <Link
              aria-current={page === 'championships' ? 'page' : undefined}
              to="/campeonatos"
            >
              Campeonatos
            </Link>
            <Link
              aria-current={page === 'statistics' ? 'page' : undefined}
              to="/estadisticas"
            >
              Estadísticas
            </Link>
            <Link className="public-admin-link" to="/admin">
              <ShieldCheck aria-hidden="true" /> Administración
            </Link>
          </nav>
        </div>
      </header>

      {page === 'not-found' ? (
        <section className="public-container public-content pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
          <h1>Página no encontrada</h1>
          <p>Esta ruta no existe.</p>
          <Link className="public-back" to="/">
            <ArrowLeft aria-hidden="true" /> Volver al inicio
          </Link>
        </section>
      ) : page === 'home' ? (
        <HomeView
          error={Boolean(error)}
          loading={loading}
          championships={championships}
          matches={matches}
        />
      ) : page === 'statistics' ? (
        <StatisticsView
          error={Boolean(matchesError || championshipsError || playersError)}
          loading={matchesLoading || championshipsLoading || playersLoading}
          championships={championships}
          matches={matches}
          players={players}
        />
      ) : (
        <div className="public-container public-content pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
          <div className="public-intro mb-8 flex items-center justify-between gap-8">
            <div>
              <h1>Campeonatos</h1>
              <p>
                Explora los campeonatos y revive cada resultado de Ernestina
                Silva.
              </p>
            </div>
            <span className="public-intro-art" aria-hidden="true">
              <Trophy />
            </span>
          </div>

          <section className="grid gap-4" aria-label={publicListingLabel}>
            <span className="public-count justify-self-end">
              {publicCountLabel(championships.length)}
            </span>
            {error && (
              <div className="public-message" role="alert">
                No pudimos cargar los datos. Actualiza la página para intentarlo
                de nuevo.
              </div>
            )}
            {loading && (
              <div className="public-message" role="status">
                Cargando datos…
              </div>
            )}
            {!loading && !error && (
              <ChampionshipList championships={summaries} />
            )}
          </section>
        </div>
      )}
    </main>
  )
}
