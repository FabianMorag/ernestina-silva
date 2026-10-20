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
import {
  championshipSummaries,
  matchesForChampionship,
  type ChampionshipSummary,
} from './championships.ts'
import {
  request,
  stageLabel,
  type Item,
  type Match,
  type Stage,
} from './tournament-api.ts'
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
    <div className="championship-list">
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
          <Link
            className="public-action"
            to={`/partidos?campeonato=${encodeURIComponent(championship.id)}`}
            aria-label={`Ver partidos de ${championship.name}`}
          >
            Ver partidos <ArrowRight aria-hidden="true" />
          </Link>
        </article>
      ))}
    </div>
  )
}

function MatchList({ matches }: { matches: Match[] }) {
  if (!matches.length)
    return (
      <div className="public-empty">
        <Swords aria-hidden="true" />
        <p>Todavía no hay partidos registrados.</p>
      </div>
    )

  return (
    <div className="public-match-list">
      {matches.map((match) => (
        <article className="public-match-row" key={match.id}>
          <div className="public-match-context">
            <span>{match.championship.name}</span>
            {match.stage && <span>{stageLabel(match.stage.kind)}</span>}
          </div>
          <div className="public-match-score">
            <span>{match.homePlayer.name}</span>
            <strong>
              {match.homeScore} <i>—</i> {match.awayScore}
            </strong>
            <span>{match.awayPlayer.name}</span>
          </div>
          <div className="public-match-teams">
            <span>{match.homeTeam.name}</span>
            <span>{match.awayTeam.name}</span>
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
  const listingChampionships = page === 'home' || page === 'championships'

  return (
    <main className="public-shell">
      <header className="public-header">
        <div className="public-container public-header-inner">
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
        <section className="public-container public-content">
          <p className="public-eyebrow">ERROR 404</p>
          <h1>Página no encontrada</h1>
          <p>Esta ruta no existe.</p>
          <Link className="public-back" to="/">
            <ArrowLeft aria-hidden="true" /> Volver al inicio
          </Link>
        </section>
      ) : (
        <div className="public-container public-content">
          <div className="public-intro">
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
            className="public-board"
            aria-labelledby="public-board-title"
          >
            <div className="public-board-header">
              <div>
                <span className="public-board-overline">ERNESTINA SILVA</span>
                <h2 id="public-board-title">
                  {listingChampionships
                    ? 'Lista de campeonatos'
                    : 'Partidos registrados'}
                </h2>
              </div>
              <span className="public-count">
                {listingChampionships
                  ? championships.length
                  : visibleMatches.length}{' '}
                {listingChampionships
                  ? championships.length === 1
                    ? 'CAMPEONATO'
                    : 'CAMPEONATOS'
                  : visibleMatches.length === 1
                    ? 'PARTIDO'
                    : 'PARTIDOS'}
              </span>
            </div>
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
