import { Swords } from 'lucide-react'
import { stageLabel, type Match } from '../../shared/tournament-api.ts'

export function MatchList({ matches }: { matches: Match[] }) {
  if (!matches.length)
    return (
      <div className="public-empty">
        <Swords aria-hidden="true" />
        <p>Todavía no hay partidos registrados.</p>
      </div>
    )

  return (
    <div className="grid gap-3">
      {matches.map((match) => (
        <article className="public-match-row" key={match.id}>
          <div className="public-match-context">
            <span>{match.championship.name}</span>
            {match.stage && <span>{stageLabel(match.stage.kind)}</span>}
            {match.group && <span>Grupo {match.group.name}</span>}
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
