import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
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
    championship: { findUnique: vi.fn(), create: vi.fn() },
    stage: { findUnique: vi.fn(), create: vi.fn() },
    player: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    team: { findUnique: vi.fn(), update: vi.fn() },
    championshipParticipant: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
    match: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (work) => work(prisma));
    prisma.championship.findUnique.mockResolvedValue({ id: 'championship' });
    prisma.championship.create.mockResolvedValue({ id: 'championship' });
    prisma.stage.findUnique.mockResolvedValue({ id: 'stage', championshipId: 'championship' });
    prisma.stage.create.mockResolvedValue({ id: 'stage', kind: 'GROUP', championshipId: 'championship' });
    prisma.player.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.team.findUnique.mockImplementation(async ({ where }) => ({ id: where.id }));
    prisma.match.create.mockResolvedValue({ id: 'match' });
    prisma.match.findUnique.mockResolvedValue({ id: 'match', championshipId: 'championship' });
    prisma.match.updateMany.mockResolvedValue({ count: 1 });
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

  it('creates a championship with its selected fixed stages', async () => {
    await expect(new TournamentController(prisma as never).createChampionship({
      name: ' Copa ', stageKinds: ['GROUP', 'KNOCKOUT'],
    })).resolves.toEqual({ id: 'championship' });
    expect(prisma.championship.create).toHaveBeenCalledWith({
      data: { name: 'Copa', stages: { create: [{ kind: 'GROUP' }, { kind: 'KNOCKOUT' }] } },
    });
  });

  it('requires at least one valid, non-repeated stage type before creating a championship', () => {
    const controller = new TournamentController(prisma as never);
    for (const stageKinds of [[], ['GROUP', 'GROUP'], ['OTHER'], 'GROUP']) {
      expect(() => controller.createChampionship({ name: 'Copa', stageKinds })).toThrow(BadRequestException);
    }
    expect(prisma.championship.create).not.toHaveBeenCalled();
  });

  it('adds a missing fixed stage to an existing championship without a name', async () => {
    const controller = new TournamentController(prisma as never);
    await expect(controller.createStage({ kind: 'GROUP', championshipId: 'championship' })).resolves.toEqual({
      id: 'stage', kind: 'GROUP', championshipId: 'championship',
    });
    expect(prisma.stage.create).toHaveBeenCalledWith({ data: { kind: 'GROUP', championshipId: 'championship' } });
  });

  it('rejects a repeated stage kind for an existing championship', async () => {
    prisma.stage.create.mockRejectedValue({ code: 'P2002' });
    await expect(new TournamentController(prisma as never).createStage({
      kind: 'GROUP', championshipId: 'championship',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an empty stage request with a client error', async () => {
    await expect(new TournamentController(prisma as never).createStage(null as never)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.stage.create).not.toHaveBeenCalled();
  });

  it('deletes only the selected match', async () => {
    prisma.match.deleteMany.mockResolvedValue({ count: 1 })
    await expect(
      new TournamentController(prisma as never).deleteMatch('match'),
    ).resolves.toEqual({ deleted: true })
    expect(prisma.match.deleteMany).toHaveBeenCalledWith({
      where: { id: 'match' },
    })
  })

  it('updates only the stage and goals of the selected match', async () => {
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: 'stage', homeScore: 4, awayScore: 1,
    })).resolves.toEqual({ updated: true });
    expect(prisma.match.updateMany).toHaveBeenCalledWith({
      where: { id: 'match' },
      data: { stageId: 'stage', homeScore: 4, awayScore: 1 },
    });
  });

  it('clears the stage without changing the player or team identities', async () => {
    await new TournamentController(prisma as never).updateMatch('match', {
      stageId: null, homeScore: 3, awayScore: 2,
    });
    expect(prisma.match.updateMany).toHaveBeenCalledWith({
      where: { id: 'match' },
      data: { stageId: null, homeScore: 3, awayScore: 2 },
    });
    expect(prisma.stage.findUnique).not.toHaveBeenCalled();
  });

  it('rejects invalid edited goals without writing', async () => {
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: 'stage', homeScore: -1, awayScore: 2,
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: 'stage', homeScore: 1.5, awayScore: 2,
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: 'stage', homeScore: 1, awayScore: -1,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a stage from another championship without writing', async () => {
    prisma.stage.findUnique.mockResolvedValue({ id: 'other-stage', championshipId: 'other' });
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: 'other-stage', homeScore: 3, awayScore: 2,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.updateMany).not.toHaveBeenCalled();
  });

  it('rejects changes to match identities when correcting a result', async () => {
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: null, homeScore: 3, awayScore: 2, homePlayerId: 'someone-else',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.match.updateMany).not.toHaveBeenCalled();
  });

  it('reports a missing match without writing', async () => {
    prisma.match.findUnique.mockResolvedValue(null);
    await expect(new TournamentController(prisma as never).updateMatch('missing', {
      stageId: null, homeScore: 3, awayScore: 2,
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.match.updateMany).not.toHaveBeenCalled();
  });

  it('reports a match removed during editing', async () => {
    prisma.match.updateMany.mockResolvedValue({ count: 0 });
    await expect(new TournamentController(prisma as never).updateMatch('match', {
      stageId: null, homeScore: 3, awayScore: 2,
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports a missing match without deleting another record', async () => {
    prisma.match.deleteMany.mockResolvedValue({ count: 0 })
    await expect(
      new TournamentController(prisma as never).deleteMatch('missing'),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.match.deleteMany).toHaveBeenCalledWith({
      where: { id: 'missing' },
    })
  })

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

  it('renames an existing team without changing its identity', async () => {
    prisma.team.update.mockResolvedValue({ id: 'team-a', name: 'Arsenal' })
    await expect(
      new TournamentController(prisma as never).updateTeam('team-a', {
        name: ' Arsenal ',
      }),
    ).resolves.toEqual({ id: 'team-a', name: 'Arsenal' })
    expect(prisma.team.update).toHaveBeenCalledWith({
      where: { id: 'team-a' },
      data: { name: 'Arsenal' },
    })
  })

  it('rejects an invalid team name without writing', async () => {
    await expect(
      new TournamentController(prisma as never).updateTeam('team-a', {
        name: ' ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.team.update).not.toHaveBeenCalled()
  })

  it('rejects renaming a missing team without writing', async () => {
    prisma.team.findUnique.mockResolvedValue(null)
    await expect(
      new TournamentController(prisma as never).updateTeam('missing', {
        name: 'Arsenal',
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.team.update).not.toHaveBeenCalled()
  })

  it('rejects a duplicate edited team name without overwriting another team', async () => {
    prisma.team.update.mockRejectedValue({ code: 'P2002' })
    await expect(
      new TournamentController(prisma as never).updateTeam('team-a', {
        name: 'team-b',
      }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

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
