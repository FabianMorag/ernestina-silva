import { BadRequestException, ConflictException } from '@nestjs/common';
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
    $transaction: vi.fn(),
    championship: { findUnique: vi.fn() },
    stage: { findUnique: vi.fn() },
    player: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    team: { findUnique: vi.fn() },
    championshipParticipant: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    match: { create: vi.fn(), findFirst: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (work) => work(prisma));
    prisma.championship.findUnique.mockResolvedValue({ id: 'championship' });
    prisma.stage.findUnique.mockResolvedValue({ id: 'stage', championshipId: 'championship' });
    prisma.player.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.team.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.match.create.mockResolvedValue({ id: 'match' });
    prisma.championshipParticipant.findUnique.mockImplementation(async ({ where }) => ({
      championshipId: where.championshipId_playerId.championshipId,
      playerId: where.championshipId_playerId.playerId,
      teamId: where.championshipId_playerId.playerId === 'home' ? 'team-a' : 'team-b',
    }));
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

  it('rejects a match whose team differs from the championship assignment', async () => {
    await expect(new TournamentController(prisma as never).createMatch({ ...input, homeTeamId: 'team-b' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.create).not.toHaveBeenCalled();
  });

  it('updates a player name and clears their optional title', async () => {
    prisma.player.findUnique.mockResolvedValue({ id: 'home' });
    prisma.player.update.mockResolvedValue({ id: 'home', name: 'Carrasco', title: null });
    await expect(new TournamentController(prisma as never).updatePlayer('home', { name: 'Carrasco', title: '' })).resolves.toMatchObject({ name: 'Carrasco', title: null });
    expect(prisma.player.update).toHaveBeenCalledWith({ where: { id: 'home' }, data: { name: 'Carrasco', title: null } });
  });

  it('creates a player with an optional title', async () => {
    prisma.player.create.mockResolvedValue({ id: 'new', name: 'nico', title: null });
    await new TournamentController(prisma as never).createPlayer({ name: ' nico ' });
    expect(prisma.player.create).toHaveBeenCalledWith({ data: { name: 'nico', title: null } });
  });

  it('rejects a duplicate edited player name without overwriting another player', async () => {
    prisma.player.update.mockRejectedValue({ code: 'P2002' });
    await expect(new TournamentController(prisma as never).updatePlayer('home', { name: 'away', title: null })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a changed team after the player has a match in that championship', async () => {
    prisma.championshipParticipant.findUnique.mockResolvedValue({ teamId: 'team-a' });
    prisma.match.findFirst.mockResolvedValue({ id: 'match' });
    await expect(new TournamentController(prisma as never).assignParticipant({ championshipId: 'championship', playerId: 'home', teamId: 'team-b' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.championshipParticipant.upsert).not.toHaveBeenCalled();
  });

  it('rejects an initial assignment conflicting with historical matches', async () => {
    prisma.championshipParticipant.findUnique.mockResolvedValue(null);
    prisma.match.findFirst.mockResolvedValue({ id: 'historical-match' });
    await expect(new TournamentController(prisma as never).assignParticipant({ championshipId: 'championship', playerId: 'home', teamId: 'team-b' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.championshipParticipant.upsert).not.toHaveBeenCalled();
  });

  it('uses serializable transactions for assignments and match creation', async () => {
    await new TournamentController(prisma as never).assignParticipant({ championshipId: 'championship', playerId: 'home', teamId: 'team-a' });
    await new TournamentController(prisma as never).createMatch(input);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(prisma.$transaction.mock.calls.every(([, options]) => options.isolationLevel === 'Serializable')).toBe(true);
  });
});
