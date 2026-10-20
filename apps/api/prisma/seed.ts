import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

export const players = [
  { id: 'seed-player-carrasco', name: 'carrasco', title: 'el campeon de la verguenza' },
  { id: 'seed-player-anito', name: 'anito', title: 'el campeon más lloron' },
  { id: 'seed-player-borito', name: 'borito', title: 'humilde y alegre' },
  { id: 'seed-player-mufasa', name: 'mufasa', title: 'the fundamentals' },
  { id: 'seed-player-nico', name: 'nico', title: null },
  { id: 'seed-player-rodrigo', name: 'rodrigo', title: 'la eterna promesa' },
  { id: 'seed-player-pipe', name: 'pipe', title: null },
  { id: 'seed-player-topo', name: 'topo', title: null },
  { id: 'seed-player-colocho', name: 'colocho', title: null },
  { id: 'seed-player-alvaro', name: 'alvaro', title: null },
  { id: 'seed-player-diego', name: 'diego', title: null },
  { id: 'seed-player-vitoko', name: 'vitoko', title: null },
] as const;

export async function seedPlayers(prisma: Pick<PrismaClient, 'player'>): Promise<void> {
  for (const player of players) {
    await prisma.player.upsert({ where: { id: player.id }, update: {}, create: player });
  }
}

if (process.argv[1]?.endsWith('/prisma/seed.ts')) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  seedPlayers(prisma)
    .then(() => console.log(`Seeded ${players.length} players`))
    .finally(() => prisma.$disconnect());
}
