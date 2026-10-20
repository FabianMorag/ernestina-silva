import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { config } from 'dotenv';
import { Client } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AuthService } from '../src/auth/auth.service.js';

const raceTest = process.env.RUN_DB_RACE_TEST === '1' ? it : it.skip;

raceTest('rejects a concurrent match using a former championship assignment', async () => {
  config();
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const name = `verify_player_race_${randomBytes(8).toString('hex')}`;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/postgres';
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  let prisma: PrismaClient | undefined;
  let app: NestFastifyApplication | undefined;
  let created = false;
  let releasePending: (() => void) | undefined;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    created = true;
    url.pathname = `/${name}`;
    const connectionString = url.toString();
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: connectionString },
      encoding: 'utf8',
    });
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    await prisma.championship.create({ data: { id: 'cup', name: 'Throwaway championship' } });
    await prisma.player.createMany({ data: [{ id: 'home', name: 'home' }, { id: 'away', name: 'away' }] });
    await prisma.team.createMany({ data: ['a', 'b', 'c'].map((value) => ({ id: `team-${value}`, name: `team ${value}` })) });
    await prisma.championshipParticipant.createMany({ data: [
      { championshipId: 'cup', playerId: 'home', teamId: 'team-a' },
      { championshipId: 'cup', playerId: 'away', teamId: 'team-b' },
    ] });

    let release!: () => void;
    let observed!: () => void;
    const proceed = new Promise<void>((resolve) => { release = resolve; });
    const paused = new Promise<void>((resolve) => { observed = resolve; });
    releasePending = release;
    const client = prisma;
    const wrapped = {
      $transaction: (callback: (tx: unknown) => Promise<unknown>, options: { isolationLevel: 'Serializable' }) =>
        client.$transaction((tx) => callback(new Proxy(tx, {
          get(target, key) {
            if (key === 'match') return new Proxy(target.match, {
              get(model, method) {
                if (method === 'create') return async (args: Parameters<typeof model.create>[0]) => {
                  observed();
                  await proceed;
                  return model.create(args);
                };
                const value = Reflect.get(model, method);
                return typeof value === 'function' ? value.bind(model) : value;
              },
            });
            const value = Reflect.get(target, key);
            return typeof value === 'function' ? value.bind(target) : value;
          },
        })), options),
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(wrapped)
      .overrideProvider(AuthService).useValue({ currentUser: async () => ({ username: 'admin' }) })
      .compile();
    app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const pendingMatch = app.inject({ method: 'POST', url: '/admin/matches', payload: {
      championshipId: 'cup', homePlayerId: 'home', awayPlayerId: 'away',
      homeTeamId: 'team-a', awayTeamId: 'team-b', homeScore: 1, awayScore: 0,
    } });
    await Promise.race([paused, new Promise((_, reject) => setTimeout(() => reject(new Error('Race gate timed out')), 3000))]);
    const reassignment = await app.inject({ method: 'POST', url: '/admin/participants', payload: {
      championshipId: 'cup', playerId: 'home', teamId: 'team-c',
    } });
    release();
    const match = await pendingMatch;
    expect(reassignment.statusCode).toBe(201);
    expect(match.statusCode).toBe(409);
    const assignment = await prisma.championshipParticipant.findUniqueOrThrow({
      where: { championshipId_playerId: { championshipId: 'cup', playerId: 'home' } },
    });
    expect(assignment.teamId).toBe('team-c');
    expect(await prisma.match.count()).toBe(0);
  } finally {
    releasePending?.();
    await app?.close();
    await prisma?.$disconnect();
    if (created) await admin.query(`DROP DATABASE "${name}"`);
    await admin.end();
  }
}, 30000);
