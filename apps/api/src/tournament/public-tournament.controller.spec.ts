import { PublicTournamentController } from './public-tournament.controller.js';

describe('PublicTournamentController', () => {
  const prisma = {
    championshipParticipant: { findMany: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.championshipParticipant.findMany.mockResolvedValue([]);
  });

  it('exposes championship participants read-only with their player and team', async () => {
    const participants = [
      {
        id: 'participant-1',
        championshipId: 'championship',
        playerId: 'player-ana',
        teamId: 'team-rojo',
        player: { id: 'player-ana', name: 'Ana', title: null },
        team: { id: 'team-rojo', name: 'Rojo FC' },
      },
    ];
    prisma.championshipParticipant.findMany.mockResolvedValue(participants);
    const controller = new PublicTournamentController(prisma as never);

    await expect(controller.participants()).resolves.toEqual(participants);
    expect(prisma.championshipParticipant.findMany).toHaveBeenCalledWith({
      include: { player: true, team: true },
      orderBy: { player: { name: 'asc' } },
    });
  });
});
