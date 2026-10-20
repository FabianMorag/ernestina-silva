import { BadRequestException } from '@nestjs/common';
import { TournamentController } from './tournament.controller.js';

const input = {
  championshipId: 'championship',
  stageId: 'stage',
  homePlayerId: 'home',
  awayPlayerId: 'away',
  homeTeamId: 'team-a',
  awayTeamId: 'team-b',
  homeScore: 3,
  awayScore: 2,
};

describe('TournamentController', () => {
  const prisma = {
    championship: { findUnique: vi.fn() },
    stage: { findUnique: vi.fn() },
    player: { findUnique: vi.fn() },
    team: { findUnique: vi.fn() },
    match: { create: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.championship.findUnique.mockResolvedValue({ id: 'championship' });
    prisma.stage.findUnique.mockResolvedValue({ id: 'stage', championshipId: 'championship' });
    prisma.player.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.team.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.match.create.mockResolvedValue({ id: 'match' });
  });

  it('persists a match between two registered players with their teams', async () => {
    const controller = new TournamentController(prisma as never);
    await expect(controller.createMatch(input)).resolves.toEqual({ id: 'match' });
    expect(prisma.match.create).toHaveBeenCalledWith({ data: input });
  });

  it('rejects a stage from another championship without writing', async () => {
    prisma.stage.findUnique.mockResolvedValue({ id: 'stage', championshipId: 'other' });
    await expect(new TournamentController(prisma as never).createMatch(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('rejects an unregistered opponent without writing', async () => {
    prisma.player.findUnique.mockImplementation(async ({ where }) => where.id === 'away' ? null : { id: where.id });
    await expect(new TournamentController(prisma as never).createMatch(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.create).not.toHaveBeenCalled();
  });
});
