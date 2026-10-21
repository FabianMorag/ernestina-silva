import { ArrowLeft, Swords, Trophy } from 'lucide-react'
import { Link, useParams } from 'react-router'
import useSWR from 'swr'
import { matchesForChampionship } from '../championships.ts'
import {
  request,
  stageLabel,
  type Item,
  type Match,
  type Participant,
  type Stage,
  type StageGroup,
} from '../tournament-api.ts'
import { buildKnockoutBracket } from './bracket.ts'
import {
  calculatePlayerStandings,
  groupStageMatches,
  leagueStageMatches,
  type PlayerStandingRow,
} from './standings.ts'
import '../public.css'

function StandingsTable({
  caption,
  rows,
}: {
  caption: string
  rows: PlayerStandingRow[]
}) {
  if (!rows.length)
    return (
      <p className="public-message" role="status">
        Aún no hay resultados registrados para esta tabla.
      </p>
    )
  return (
    <div className="public-table-scroll">
      <table className="public-standings">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Pos.</th>
            <th scope="col">Jugador</th>
            <th scope="col">Equipo</th>
            <th scope="col">Pj</th>
            <th scope="col">G</th>
            <th scope="col">E</th>
            <th scope="col">P</th>
            <th scope="col">GF</th>
            <th scope="col">GC</th>
            <th scope="col">DG</th>
            <th scope="col">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.playerId}>
              <td>{index + 1}</td>
              <th scope="row">{row.playerName}</th>
              <td>{row.teamName}</td>
              <td>{row.played}</td>
              <td>{row.wins}</td>
              <td>{row.draws}</td>
              <td>{row.losses}</td>
              <td>{row.goalsFor}</td>
              <td>{row.goalsAgainst}</td>
              <td>{row.goalDifference}</td>
              <td>
                <strong>{row.points}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupSection({
  group,
  matches,
  participants,
}: {
  group: StageGroup
  matches: Match[]
  participants: Participant[]
}) {
  const rows = calculatePlayerStandings(
    groupStageMatches(matches, group.id),
    participants,
  )
  return (
    <section
      className="public-detail-section"
      aria-labelledby={`group-${group.id}`}
    >
      <h3 id={`group-${group.id}`}>Grupo {group.name}</h3>
      <StandingsTable
        caption={`Tabla de posiciones del grupo ${group.name}`}
        rows={rows}
      />
    </section>
  )
}

function KnockoutSection({ matches }: { matches: Match[] }) {
  const bracket = buildKnockoutBracket(matches)
  if (!bracket.rounds.length && !bracket.unplaced.length)
    return (
      <p className="public-message" role="status">
        Todavía no hay partidos de eliminación directa registrados.
      </p>
    )
  return (
    <div className="public-bracket-wrap">
      {bracket.rounds.length > 0 && (
        <div
          className="public-bracket"
          role="list"
          aria-label="Llaves del torneo"
        >
          {bracket.rounds.map((round) => (
            <div
              className="public-bracket-round"
              role="listitem"
              key={round.round}
            >
              <h3>{round.label}</h3>
              {round.slots.map((slot) => (
                <div className="public-bracket-slot" key={slot.slot}>
                  {slot.match ? (
                    <>
                      <span>
                        {slot.match.homePlayer.name}{' '}
                        <strong>{slot.match.homeScore}</strong>
                      </span>
                      <span>
                        {slot.match.awayPlayer.name}{' '}
                        <strong>{slot.match.awayScore}</strong>
                      </span>
                    </>
                  ) : (
                    <span className="public-bracket-empty">
                      Sin partido registrado
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {bracket.unplaced.length > 0 && (
        <div className="public-unplaced">
          <h3>Partidos de eliminación sin llave registrada</h3>
          <p>Estos partidos no tienen ronda y posición registradas.</p>
          <ul>
            {bracket.unplaced.map((match) => (
              <li key={match.id}>
                {match.homePlayer.name} {match.homeScore} — {match.awayScore}{' '}
                {match.awayPlayer.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function History({ matches }: { matches: Match[] }) {
  if (!matches.length)
    return (
      <p className="public-message" role="status">
        Todavía no hay partidos registrados en este campeonato.
      </p>
    )
  return (
    <ol className="public-history">
      {matches.map((match) => (
        <li key={match.id} className="public-history-row">
          <span className="public-history-context">
            {match.stage ? stageLabel(match.stage.kind) : 'Sin fase'}
            {match.group ? ` · Grupo ${match.group.name}` : ''}
          </span>
          <span>
            {match.homePlayer.name}{' '}
            <strong>
              {match.homeScore} — {match.awayScore}
            </strong>{' '}
            {match.awayPlayer.name}
          </span>
          <span className="public-history-teams">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </span>
        </li>
      ))}
    </ol>
  )
}

export function PublicChampionshipDetail() {
  const { championshipId = '' } = useParams()
  const {
    data: championships,
    error: championshipsError,
    isLoading: championshipsLoading,
  } = useSWR<Item[]>('/tournament/championships', request)
  const {
    data: matches = [],
    error: matchesError,
    isLoading: matchesLoading,
  } = useSWR<Match[]>('/tournament/matches', request)
  const {
    data: stages = [],
    error: stagesError,
    isLoading: stagesLoading,
  } = useSWR<Stage[]>('/tournament/stages', request)
  const {
    data: groups = [],
    error: groupsError,
    isLoading: groupsLoading,
  } = useSWR<StageGroup[]>('/tournament/groups', request)
  const {
    data: participants = [],
    error: participantsError,
    isLoading: participantsLoading,
  } = useSWR<Participant[]>('/tournament/participants', request)

  const error =
    championshipsError ||
    matchesError ||
    stagesError ||
    groupsError ||
    participantsError
  const loading =
    championshipsLoading ||
    matchesLoading ||
    stagesLoading ||
    groupsLoading ||
    participantsLoading

  const championship = championships?.find((item) => item.id === championshipId)
  const championshipMatches = matchesForChampionship(matches, championshipId)
  const championshipGroups = groups.filter((group) =>
    stages.some(
      (stage) =>
        stage.championshipId === championshipId &&
        stage.kind === 'GROUP' &&
        group.stageId === stage.id,
    ),
  )
  const championshipParticipants = participants.filter(
    (participant) => participant.championshipId === championshipId,
  )
  const leagueMatches = leagueStageMatches(championshipMatches, championshipId)
  const leagueRows = calculatePlayerStandings(
    leagueMatches,
    championshipParticipants,
  )
  const knockoutMatches = championshipMatches.filter(
    (match) => match.stage?.kind === 'KNOCKOUT',
  )
  const hasGroupStage = stages.some(
    (stage) =>
      stage.championshipId === championshipId && stage.kind === 'GROUP',
  )

  return (
    <main className="public-shell">
      <div className="public-container public-content">
        <Link className="public-back" to="/campeonatos">
          <ArrowLeft aria-hidden="true" /> Volver a campeonatos
        </Link>

        {error && (
          <div className="public-message" role="alert">
            No pudimos cargar los datos. Actualiza la página para intentarlo de
            nuevo.
          </div>
        )}
        {loading && (
          <div className="public-message" role="status">
            Cargando campeonato…
          </div>
        )}

        {!loading && !error && !championship && (
          <section
            className="public-empty"
            aria-labelledby="missing-championship"
          >
            <Trophy aria-hidden="true" />
            <h1 id="missing-championship">Campeonato no encontrado</h1>
            <p>No encontramos un campeonato con este enlace.</p>
          </section>
        )}

        {!loading && !error && championship && (
          <>
            <header className="public-intro">
              <div>
                <p className="public-eyebrow">CAMPEONATO</p>
                <h1>{championship.name}</h1>
                <p>
                  {championshipMatches.length}{' '}
                  {championshipMatches.length === 1
                    ? 'partido registrado'
                    : 'partidos registrados'}
                </p>
              </div>
              <span className="public-intro-art" aria-hidden="true">
                <Trophy />
              </span>
            </header>

            {hasGroupStage && (
              <section className="public-board" aria-labelledby="groups-title">
                <h2 id="groups-title">Grupos</h2>
                {championshipGroups.length === 0 ? (
                  <p className="public-message" role="status">
                    Este campeonato no tiene grupos registrados.
                  </p>
                ) : (
                  championshipGroups.map((group) => (
                    <GroupSection
                      key={group.id}
                      group={group}
                      matches={championshipMatches}
                      participants={championshipParticipants}
                    />
                  ))
                )}
              </section>
            )}

            {leagueMatches.length > 0 && (
              <section className="public-board" aria-labelledby="league-title">
                <h2 id="league-title">Liga</h2>
                <StandingsTable
                  caption="Tabla de posiciones de la liga"
                  rows={leagueRows}
                />
              </section>
            )}

            <section className="public-board" aria-labelledby="knockout-title">
              <h2 id="knockout-title">Llaves</h2>
              <KnockoutSection matches={knockoutMatches} />
            </section>

            <section className="public-board" aria-labelledby="history-title">
              <h2 id="history-title">
                <Swords aria-hidden="true" /> Historial de partidos
              </h2>
              <History matches={championshipMatches} />
            </section>
          </>
        )}
      </div>
    </main>
  )
}
