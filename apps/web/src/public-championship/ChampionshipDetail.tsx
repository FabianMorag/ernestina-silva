import type { CSSProperties } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Link, useParams } from 'react-router'
import useSWR from 'swr'
import { matchesForChampionship } from '../championships.ts'
import {
  request,
  type Item,
  type Match,
  type Participant,
  type Stage,
  type StageGroup,
} from '../tournament-api.ts'
import {
  bracketRoundClass,
  buildKnockoutBracket,
  connectsToNextRound,
} from './bracket.ts'
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
          style={
            {
              '--bracket-base-slots': bracket.rounds[0].slots.length,
            } as CSSProperties
          }
        >
          {bracket.rounds.map((round, roundIndex) => (
            <div
              className={bracketRoundClass(
                round,
                bracket.rounds[roundIndex + 1],
              )}
              role="listitem"
              key={round.round}
            >
              <h3>{round.label}</h3>
              {round.slots.map((slot, slotIndex) => (
                <div
                  className="public-bracket-slot"
                  key={slot.slot}
                  style={
                    {
                      gridRow: `${slotIndex * (bracket.rounds[0].slots.length / round.slots.length) + 1} / span ${bracket.rounds[0].slots.length / round.slots.length}`,
                    } as CSSProperties
                  }
                >
                  {slot.match ? (
                    <>
                      <div className="public-bracket-player">
                        <span>
                          <strong>{slot.match.homePlayer.name}</strong>
                          <small>{slot.match.homeTeam.name}</small>
                        </span>
                        <b>{slot.match.homeScore}</b>
                      </div>
                      <div className="public-bracket-player">
                        <span>
                          <strong>{slot.match.awayPlayer.name}</strong>
                          <small>{slot.match.awayTeam.name}</small>
                        </span>
                        <b>{slot.match.awayScore}</b>
                      </div>
                    </>
                  ) : (
                    <span className="public-bracket-empty">
                      Sin partido registrado
                    </span>
                  )}
                </div>
              ))}
              {connectsToNextRound(round, bracket.rounds[roundIndex + 1]) &&
                Array.from(
                  { length: round.slots.length / 2 },
                  (_, pairIndex) => (
                    <span
                      className="public-bracket-fork"
                      key={`fork-${pairIndex}`}
                      aria-hidden="true"
                      style={
                        {
                          gridRow: `${pairIndex * 2 * (bracket.rounds[0].slots.length / round.slots.length) + 1} / span ${2 * (bracket.rounds[0].slots.length / round.slots.length)}`,
                        } as CSSProperties
                      }
                    />
                  ),
                )}
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
      <div className="public-container pt-12 pb-24 [@media(max-width:760px)]:pt-10 [@media(max-width:760px)]:pb-16">
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
            <header className="public-intro mb-8 flex items-center justify-between gap-8">
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
          </>
        )}
      </div>
    </main>
  )
}
