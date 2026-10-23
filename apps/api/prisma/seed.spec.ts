import { players, seedPlayers, seedTeams, teams } from './seed.js';

describe('player seed', () => {
  it('uses stable identities and does not overwrite edited players on rerun', async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    await seedPlayers({ player: { upsert } } as never);
    expect(upsert).toHaveBeenCalledTimes(12);
    expect(players.map(({ name }) => name)).toEqual(['Carrasco', 'Anito', 'Borito', 'Mufasa', 'Nico', 'Rodrigo', 'Pipe', 'Topo', 'Colocho', 'Alvaro', 'Diego', 'Vitoko']);
    expect(players.map(({ title }) => title)).toEqual(['El campeón de la vergüenza', 'El campeón más llorón', 'Humilde y alegre', 'The Fundamentals', null, 'La eterna promesa', null, null, null, null, null, null]);
    expect(upsert).toHaveBeenCalledWith({ where: { id: 'seed-player-carrasco' }, update: {}, create: players[0] });
    expect(players.filter(({ title }) => title !== null)).toHaveLength(5);
  });
});

describe('team seed', () => {
  it('uses stable identities and does not overwrite edited teams on rerun', async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    await seedTeams({ team: { upsert } } as never);
    expect(upsert).toHaveBeenCalledTimes(19);
    expect(teams.map(({ name }) => name)).toEqual([
      'Bayern Munich', 'Manchester City', 'Inter de Milán', 'Arsenal', 'Real Madrid', 'Paris Saint-Germain F.C.', 'FC Barcelona',
      'Liverpool', 'Atlético Madrid', 'España', 'Bélgica', 'Inglaterra', 'Brasil', 'Alemania', 'Italia',
      'Holanda', 'Portugal', 'Francia', 'Argentina',
    ]);
    expect(upsert).toHaveBeenCalledWith({ where: { id: 'seed-team-inter-de-milan' }, update: {}, create: teams[2] });
  });
});
