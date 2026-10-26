import { Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { homeTotalsLine, summarizeHome } from './summary.ts'
import { championshipDetailPath } from '../championships.ts'
import { type Item, type Match } from '../../shared/tournament-api.ts'
import { MatchList } from '../matches/MatchList.tsx'

export function HomeView({
  error,
  loading,
  championships,
  matches,
}: {
  error: boolean
  loading: boolean
  championships: Item[]
  matches: Match[]
}) {
  const summary = summarizeHome(championships, matches)
  const ready = !loading && !error
  return (
    <div className="public-container pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
      <div className="public-intro mb-8 flex items-center justify-between gap-8">
        <div>
          <h1>Último partido</h1>
          {ready && <p>{homeTotalsLine(summary)}</p>}
        </div>
        <span className="public-intro-art" aria-hidden="true">
          <Trophy />
        </span>
      </div>

      <section aria-label="Último partido registrado">
        {error && (
          <div className="public-message" role="alert">
            No pudimos cargar los datos. Actualiza la página para intentarlo de
            nuevo.
          </div>
        )}
        {loading && (
          <div className="public-message" role="status">
            Cargando datos…
          </div>
        )}
        {ready &&
          (summary.latestRecordedMatch ? (
            <MatchList matches={[summary.latestRecordedMatch]} />
          ) : (
            <p className="public-message" role="status">
              Todavía no hay partidos registrados.
            </p>
          ))}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        {ready && summary.latestChampionship && (
          <Link
            className="public-action public-action-secondary"
            to={championshipDetailPath(summary.latestChampionship.id)}
          >
            Ver detalle de {summary.latestChampionship.name}
          </Link>
        )}
      </div>
    </div>
  )
}
