import { players, seedPlayers } from './seed.js';

describe('player seed', () => {
  it('uses stable identities and does not overwrite edited players on rerun', async () => {
    const upsert = vi.fn().mockResolvedValue(undefined);
    await seedPlayers({ player: { upsert } } as never);
    expect(upsert).toHaveBeenCalledTimes(12);
    expect(players.map(({ name }) => name)).toEqual(['carrasco', 'anito', 'borito', 'mufasa', 'nico', 'rodrigo', 'pipe', 'topo', 'colocho', 'alvaro', 'diego', 'vitoko']);
    expect(upsert).toHaveBeenCalledWith({ where: { id: 'seed-player-carrasco' }, update: {}, create: players[0] });
    expect(players.filter(({ title }) => title !== null)).toHaveLength(5);
  });
});
