import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

export const players = [
  { id: 'seed-player-carrasco', name: 'Carrasco', title: 'El campeón de la vergüenza' },
  { id: 'seed-player-anito', name: 'Anito', title: 'El campeón más llorón' },
  { id: 'seed-player-borito', name: 'Borito', title: 'Humilde y alegre' },
  { id: 'seed-player-mufasa', name: 'Mufasa', title: 'The Fundamentals' },
  { id: 'seed-player-nico', name: 'Nico', title: null },
  { id: 'seed-player-rodrigo', name: 'Rodrigo', title: 'La eterna promesa' },
  { id: 'seed-player-pipe', name: 'Pipe', title: null },
  { id: 'seed-player-topo', name: 'Topo', title: null },
  { id: 'seed-player-colocho', name: 'Colocho', title: null },
  { id: 'seed-player-alvaro', name: 'Alvaro', title: null },
  { id: 'seed-player-diego', name: 'Diego', title: null },
  { id: 'seed-player-vitoko', name: 'Vitoko', title: null },
] as const;

export const teams = [
  { id: 'seed-team-bayern-munich', name: 'Bayern Munich' },
  { id: 'seed-team-manchester-city', name: 'Manchester City' },
  { id: 'seed-team-inter-de-milan', name: 'Inter de Milán' },
  { id: 'seed-team-arsenal', name: 'Arsenal' },
  { id: 'seed-team-real-madrid', name: 'Real Madrid' },
  { id: 'seed-team-psg', name: 'Paris Saint-Germain F.C.' },
  { id: 'seed-team-barcelona', name: 'FC Barcelona' },
  { id: 'seed-team-liverpool', name: 'Liverpool' },
  { id: 'seed-team-atletico-madrid', name: 'Atlético Madrid' },
  { id: 'seed-team-espana', name: 'España' },
  { id: 'seed-team-belgica', name: 'Bélgica' },
  { id: 'seed-team-inglaterra', name: 'Inglaterra' },
  { id: 'seed-team-brasil', name: 'Brasil' },
  { id: 'seed-team-alemania', name: 'Alemania' },
  { id: 'seed-team-italia', name: 'Italia' },
  { id: 'seed-team-holanda', name: 'Holanda' },
  { id: 'seed-team-portugal', name: 'Portugal' },
  { id: 'seed-team-francia', name: 'Francia' },
  { id: 'seed-team-argentina', name: 'Argentina' },
] as const;

export async function seedPlayers(prisma: Pick<PrismaClient, 'player'>): Promise<void> {
  for (const player of players) {
    await prisma.player.upsert({ where: { id: player.id }, update: {}, create: player });
  }
}

export async function seedTeams(prisma: Pick<PrismaClient, 'team'>): Promise<void> {
  for (const team of teams) {
    await prisma.team.upsert({ where: { id: team.id }, update: {}, create: team });
  }
}

if (process.argv[1]?.endsWith('/prisma/seed.ts')) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedPlayers(prisma)
    .then(() => seedTeams(prisma))
    .then(() => console.log(`Seeded ${players.length} players and ${teams.length} teams`))
    .finally(() => prisma.$disconnect());
}
