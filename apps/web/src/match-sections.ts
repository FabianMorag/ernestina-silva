import {
  knockoutRoundLabel,
  stageLabel,
  type Match,
  type Stage,
} from './tournament-api.ts'

export type MatchSection = {
  key: string
  title: string
  matches: Match[]
}

type OrderedSection = MatchSection & {
  stageOrder: number
  groupName: string
  knockoutRound: number
  isKnockout: boolean
}

const STAGE_ORDER: Record<Stage['kind'], number> = {
  GROUP: 0,
  LEAGUE: 1,
  KNOCKOUT: 2,
}

function sectionFor(match: Match): OrderedSection {
  const stage = match.stage
  if (!stage)
    return {
      key: 'unstaged',
      title: 'Sin etapa',
      matches: [match],
      stageOrder: Number.POSITIVE_INFINITY,
      groupName: '',
      knockoutRound: 0,
      isKnockout: false,
    }

  if (stage.kind === 'GROUP')
    return {
      key: `${stage.id}:group:${match.group?.id ?? 'unassigned'}`,
      title: match.group ? `Grupo ${match.group.name}` : 'Sin grupo',
      matches: [match],
      stageOrder: STAGE_ORDER.GROUP,
      groupName: match.group?.name ?? '\uffff',
      knockoutRound: 0,
      isKnockout: false,
    }

  if (stage.kind === 'KNOCKOUT')
    return {
      key: `${stage.id}:round:${match.knockoutRound ?? 'unassigned'}`,
      title: match.knockoutRound
        ? knockoutRoundLabel(match.knockoutRound)
        : 'Ronda sin asignar',
      matches: [match],
      stageOrder: STAGE_ORDER.KNOCKOUT,
      groupName: '',
      knockoutRound: match.knockoutRound ?? 0,
      isKnockout: true,
    }

  return {
    key: stage.id,
    title: stageLabel(stage.kind),
    matches: [match],
    stageOrder: STAGE_ORDER[stage.kind],
    groupName: '',
    knockoutRound: 0,
    isKnockout: false,
  }
}

export function groupMatchesByStage(matches: Match[]): MatchSection[] {
  const sections = new Map<string, OrderedSection>()

  for (const match of matches) {
    const section = sectionFor(match)
    const existing = sections.get(section.key)
    if (existing) existing.matches.push(match)
    else sections.set(section.key, section)
  }

  return [...sections.values()]
    .sort(
      (a, b) =>
        a.stageOrder - b.stageOrder ||
        a.groupName.localeCompare(b.groupName) ||
        b.knockoutRound - a.knockoutRound,
    )
    .map((section) => ({
      key: section.key,
      title: section.title,
      matches: section.isKnockout
        ? [...section.matches].sort(
            (a, b) => (a.knockoutSlot ?? 0) - (b.knockoutSlot ?? 0),
          )
        : section.matches,
    }))
}
