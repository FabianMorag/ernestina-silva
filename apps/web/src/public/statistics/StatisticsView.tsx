import { ChartNoAxesCombined } from 'lucide-react'
import type { Championship, Item, Match } from '../../shared/tournament-api.ts'
import type { PlayerStandingRow } from '../championship/standings.ts'
import { performancePercentage, playerStatistics } from './statistics.ts'

function StatisticsTable({
  title,
  id,
  rows,
}: {
  title: string
  id: string
  rows: PlayerStandingRow[]
}) {
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="public-message">Todavía no hay partidos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[760px] border-collapse text-right text-sm"
            aria-labelledby={id}
          >
            <thead>
              <tr className="border-b border-[#405450] text-[#b8c7c2]">
                <th scope="col" className="py-3 pr-4 text-left font-semibold">
                  Jugador
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Partidos jugados">PJ</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Ganados">G</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Empatados">E</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Perdidos">P</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Puntos">Pts</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Goles a favor">GF</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Goles en contra">GC</abbr>
                </th>
                <th scope="col" className="px-2 py-3 font-semibold">
                  <abbr title="Diferencia de goles">DG</abbr>
                </th>
                <th scope="col" className="py-3 pl-2 font-semibold">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.playerId}
                  className="border-b border-[#293a3a] last:border-0"
                >
                  <th
                    scope="row"
                    className="py-3 pr-4 text-left font-semibold whitespace-nowrap"
                  >
                    {row.playerName}
                  </th>
                  <td className="px-2 py-3">{row.played}</td>
                  <td className="px-2 py-3">{row.wins}</td>
                  <td className="px-2 py-3">{row.draws}</td>
                  <td className="px-2 py-3">{row.losses}</td>
                  <td className="px-2 py-3 font-bold text-[#c7f86f]">
                    {row.points}
                  </td>
                  <td className="px-2 py-3">{row.goalsFor}</td>
                  <td className="px-2 py-3">{row.goalsAgainst}</td>
                  <td className="px-2 py-3">
                    {row.goalDifference > 0 ? '+' : ''}
                    {row.goalDifference}
                  </td>
                  <td className="py-3 pl-2 font-semibold">
                    {performancePercentage(row).toFixed(1).replace('.', ',')}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function StatisticsView({
  error,
  loading,
  championships,
  matches,
  players,
}: {
  error: boolean
  loading: boolean
  championships: Championship[]
  matches: Match[]
  players: Item[]
}) {
  const ready = !loading && !error
  const statistics = ready
    ? playerStatistics(matches, championships, players)
    : null

  return (
    <div className="public-container pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
      <header className="public-intro mb-10 flex items-center justify-between gap-8">
        <div>
          <h1>Estadísticas</h1>
          <p>Resultados acumulados de todos los campeonatos.</p>
        </div>
        <span className="public-intro-art" aria-hidden="true">
          <ChartNoAxesCombined />
        </span>
      </header>
      {error && (
        <p className="public-message" role="alert">
          No pudimos cargar las estadísticas. Actualiza la página para
          intentarlo de nuevo.
        </p>
      )}
      {loading && (
        <p className="public-message" role="status">
          Cargando estadísticas…
        </p>
      )}
      {statistics && (
        <div className="space-y-12">
          <StatisticsTable
            title="Copa América"
            id="copa-america-stats"
            rows={statistics.copaAmerica}
          />
          <StatisticsTable
            title="Mundial"
            id="world-cup-stats"
            rows={statistics.worldCup}
          />
          <StatisticsTable
            title="General"
            id="general-stats"
            rows={statistics.general}
          />
          <p className="text-sm text-[#aebfb8]">
            Rendimiento = puntos obtenidos ÷ (3 × partidos jugados).
          </p>
        </div>
      )}
    </div>
  )
}
