import { ArrowRight, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { homeTotalsLine, summarizeHome } from '../../home.ts'
import { championshipDetailPath } from '../../championships.ts'
import { type Item, type Match } from '../../tournament-api.ts'
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
    <div className="public-container public-content">
      <div className="public-intro">
        <div>
          <p className="public-eyebrow">ARCHIVO PÚBLICO</p>
          <h1>Todo el campeonato, partido a partido</h1>
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

      <div className="public-access">
        <Link className="public-action" to="/campeonatos">
          Ver campeonatos <ArrowRight aria-hidden="true" />
        </Link>
        <Link className="public-action public-action-secondary" to="/partidos">
          Ver historial de partidos
        </Link>
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
