import { BadRequestException } from '@nestjs/common';

export type MatchInput = {
  championshipId: string;
  stageId: string | null;
  groupId: string | null;
  homePlayerId: string;
  awayPlayerId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
};

export function parseMatchInput(value: unknown): MatchInput {
  if (!value || typeof value !== 'object') throw new BadRequestException('Match is required');
  const input = value as Record<string, unknown>;
  const ids = ['championshipId', 'homePlayerId', 'awayPlayerId', 'homeTeamId', 'awayTeamId'] as const;
  for (const key of ids) {
    if (typeof input[key] !== 'string' || !input[key]) {
      throw new BadRequestException(`${key} is required`);
    }
  }
  if (input.stageId != null && (typeof input.stageId !== 'string' || !input.stageId)) {
    throw new BadRequestException('stageId must be an identifier');
  }
  if (input.groupId != null && (typeof input.groupId !== 'string' || !input.groupId)) {
    throw new BadRequestException('groupId must be an identifier');
  }
  if (input.homePlayerId === input.awayPlayerId) {
    throw new BadRequestException('A player cannot play against themselves');
  }
  for (const key of ['homeScore', 'awayScore'] as const) {
    if (!Number.isInteger(input[key]) || (input[key] as number) < 0) {
      throw new BadRequestException(`${key} must be a non-negative integer`);
    }
  }
  return {
    championshipId: input.championshipId as string,
    stageId: (input.stageId as string | null) ?? null,
    groupId: (input.groupId as string | null) ?? null,
    homePlayerId: input.homePlayerId as string,
    awayPlayerId: input.awayPlayerId as string,
    homeTeamId: input.homeTeamId as string,
    awayTeamId: input.awayTeamId as string,
    homeScore: input.homeScore as number,
    awayScore: input.awayScore as number,
  };
}
