import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Swords,
  Trophy,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import useSWR from 'swr'
import { HomeView } from './home/HomeView.tsx'
import { MatchList } from './matches/MatchList.tsx'
import {
  championshipDetailPath,
  championshipSummaries,
  matchesForChampionship,
  type ChampionshipSummary,
} from './championships.ts'
import {
  publicCountLabel,
  publicListingLabel,
  type PublicListing,
} from './listing.ts'
import {
  request,
  stageLabel,
  type Item,
  type Match,
  type Stage,
} from '../shared/tournament-api.ts'
import './public.css'

type PublicRoute = 'home' | 'matches' | 'championships' | 'not-found'

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
            <Link
              className="public-action public-action-secondary"
              to={`/partidos?campeonato=${encodeURIComponent(championship.id)}`}
              aria-label={`Ver partidos de ${championship.name}`}
            >
              Ver partidos
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}

export function PublicPage({ page }: { page: PublicRoute }) {
  const [searchParams] = useSearchParams()
  const {
    data: matches = [],
    error: matchesError,
    isLoading: matchesLoading,
  } = useSWR<Match[]>('/tournament/matches', request)
  const {
    data: championships = [],
    error: championshipsError,
    isLoading: championshipsLoading,
  } = useSWR<Item[]>('/tournament/championships', request)
  const {
    data: stages = [],
    error: stagesError,
    isLoading: stagesLoading,
  } = useSWR<Stage[]>('/tournament/stages', request)
  const error = matchesError || championshipsError || stagesError
  const loading = matchesLoading || championshipsLoading || stagesLoading
  const summaries = championshipSummaries(championships, matches, stages)
  const selectedId = page === 'matches' ? searchParams.get('campeonato') : null
  const selectedChampionship = selectedId
    ? championships.find((item) => item.id === selectedId)
    : undefined
  const visibleMatches = matchesForChampionship(matches, selectedId)
  const listingChampionships = page === 'championships'
  const listing: PublicListing = listingChampionships
    ? 'championships'
    : 'matches'
  const visibleCount = listingChampionships
    ? championships.length
    : visibleMatches.length

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
              aria-current={page === 'matches' ? 'page' : undefined}
              to="/partidos"
            >
              Partidos
            </Link>
            <Link className="public-admin-link" to="/admin">
              <ShieldCheck aria-hidden="true" /> Administración
            </Link>
          </nav>
        </div>
      </header>

      {page === 'not-found' ? (
        <section className="public-container public-content pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
          <p className="public-eyebrow">ERROR 404</p>
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
      ) : (
        <div className="public-container public-content pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
          <div className="public-intro mb-8 flex items-center justify-between gap-8">
            <div>
              <p className="public-eyebrow">EL ARCHIVO DEL CAMPEONATO</p>
              <h1>
                {page === 'matches'
                  ? selectedChampionship
                    ? `Partidos · ${selectedChampionship.name}`
                    : 'Historial de partidos'
                  : 'Campeonatos'}
              </h1>
              <p>
                {listingChampionships
                  ? 'Explora los campeonatos y revive cada resultado de Ernestina Silva.'
                  : 'Todos los resultados registrados, partido a partido.'}
              </p>
            </div>
            <span className="public-intro-art" aria-hidden="true">
              <Trophy />
            </span>
          </div>

          <section
            className="grid gap-4"
            aria-label={publicListingLabel(listing)}
          >
            <span className="public-count justify-self-end">
              {publicCountLabel(listing, visibleCount)}
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
            {!loading &&
              !error &&
              (listingChampionships ? (
                <ChampionshipList championships={summaries} />
              ) : (
                <MatchList matches={visibleMatches} />
              ))}
          </section>
          {page === 'matches' && selectedChampionship && (
            <Link className="public-back" to="/">
              <ArrowLeft aria-hidden="true" /> Volver a campeonatos
            </Link>
          )}
        </div>
      )}
    </main>
  )
}
