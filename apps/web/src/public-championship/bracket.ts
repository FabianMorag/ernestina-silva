import {
  KNOCKOUT_ROUNDS,
  knockoutRoundLabel,
  knockoutSlots,
  type Match,
} from '../tournament-api.ts'

export type BracketSlot = { slot: number; match: Match | null }
export type BracketRound = {
  round: number
  label: string
  slots: BracketSlot[]
}
export type KnockoutBracket = {
  rounds: BracketRound[]
  // Knockout matches without a valid recorded round/slot: shown honestly apart.
  unplaced: Match[]
  // Never inferred from results; always null in this projection.
  champion: null
}

export function connectsToNextRound(
  round: BracketRound,
  nextRound: BracketRound | undefined,
): boolean {
  return nextRound?.round === round.round / 2
}

export function bracketRoundClass(
  round: BracketRound,
  nextRound: BracketRound | undefined,
): string {
  return connectsToNextRound(round, nextRound)
    ? 'public-bracket-round is-connected'
    : 'public-bracket-round'
}

const isKnockout = (match: Match) => match.stage?.kind === 'KNOCKOUT'

function hasValidPlacement(match: Match): boolean {
  if (match.knockoutRound == null || match.knockoutSlot == null) return false
  const slots = knockoutSlots(match.knockoutRound)
  return slots.includes(match.knockoutSlot)
}

/**
 * Projects recorded knockout placements into rounds. It places a match only
 * from its persisted knockoutRound/knockoutSlot; it never guesses participants,
 * progression, or a champion. Rounds run from the largest (earliest) to the
 * final, and empty slots stay empty.
 */
export function buildKnockoutBracket(matches: Match[]): KnockoutBracket {
  const knockout = matches.filter(isKnockout)
  const placed = knockout.filter(hasValidPlacement)
  const unplaced = knockout.filter((match) => !hasValidPlacement(match))

  const rounds: BracketRound[] = KNOCKOUT_ROUNDS.filter((round) =>
    placed.some((match) => match.knockoutRound === round),
  )
    .sort((a, b) => b - a)
    .map((round) => ({
      round,
      label: knockoutRoundLabel(round),
      slots: knockoutSlots(round).map((slot) => ({
        slot,
        match:
          placed.find(
            (match) =>
              match.knockoutRound === round && match.knockoutSlot === slot,
          ) ?? null,
      })),
    }))

  return { rounds, unplaced, champion: null }
}
