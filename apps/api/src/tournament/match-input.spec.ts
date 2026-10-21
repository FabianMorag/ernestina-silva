import { BadRequestException } from '@nestjs/common';
import { parseMatchInput } from './match-input.js';

const valid = {
  championshipId: 'championship',
  stageId: 'stage',
  homePlayerId: 'first',
  awayPlayerId: 'second',
  homeTeamId: 'team-one',
  awayTeamId: 'team-two',
  homeScore: 2,
  awayScore: 1,
};

describe('parseMatchInput', () => {
  it('accepts two distinct registered-player identifiers and scores', () => {
    expect(parseMatchInput(valid)).toEqual({ ...valid, groupId: null });
  });

  it('rejects a player facing themselves', () => {
    expect(() => parseMatchInput({ ...valid, awayPlayerId: 'first' })).toThrow(BadRequestException);
  });

  it('rejects invalid scores', () => {
    expect(() => parseMatchInput({ ...valid, homeScore: -1 })).toThrow(BadRequestException);
    expect(() => parseMatchInput({ ...valid, homeScore: 1.5 })).toThrow(BadRequestException);
  });

  it('normalizes an omitted group to null and rejects invalid group identifiers', () => {
    expect(parseMatchInput(valid)).toEqual({ ...valid, groupId: null });
    expect(() => parseMatchInput({ ...valid, groupId: '' })).toThrow(BadRequestException);
  });
});
