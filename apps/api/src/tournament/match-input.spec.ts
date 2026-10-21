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
    expect(parseMatchInput(valid)).toEqual({ ...valid, groupId: null, knockoutRound: null, knockoutSlot: null });
  });

  it('rejects a player facing themselves', () => {
    expect(() => parseMatchInput({ ...valid, awayPlayerId: 'first' })).toThrow(BadRequestException);
  });

  it('rejects invalid scores', () => {
    expect(() => parseMatchInput({ ...valid, homeScore: -1 })).toThrow(BadRequestException);
    expect(() => parseMatchInput({ ...valid, homeScore: 1.5 })).toThrow(BadRequestException);
  });

  it('normalizes an omitted group to null and rejects invalid group identifiers', () => {
    expect(parseMatchInput(valid)).toEqual({ ...valid, groupId: null, knockoutRound: null, knockoutSlot: null });
    expect(() => parseMatchInput({ ...valid, groupId: '' })).toThrow(BadRequestException);
  });

  it('accepts a manually assigned knockout round and slot, and leaves older matches unplaced', () => {
    expect(parseMatchInput({ ...valid, knockoutRound: 8, knockoutSlot: 3 }))
      .toMatchObject({ knockoutRound: 8, knockoutSlot: 3 });
    expect(parseMatchInput(valid)).toMatchObject({ knockoutRound: null, knockoutSlot: null });
  });

  it('rejects incomplete or invalid knockout placement', () => {
    for (const placement of [
      { knockoutRound: 8 },
      { knockoutRound: 3, knockoutSlot: 1 },
      { knockoutRound: 8, knockoutSlot: 5 },
      { knockoutRound: 4, knockoutSlot: 0 },
    ]) {
      expect(() => parseMatchInput({ ...valid, ...placement })).toThrow(BadRequestException);
    }
  });
});
