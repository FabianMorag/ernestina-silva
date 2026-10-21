import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const migration = new URL('../../prisma/migrations/20261021150000_knockout_placement/migration.sql', import.meta.url);
const testWithDatabase = process.env.DATABASE_URL ? it : it.skip;

testWithDatabase('knockout placement migration rejects partial and occupied slots without changing stored matches', async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE TEMP TABLE "Match" ("id" TEXT PRIMARY KEY, "stageId" TEXT)');
    await client.query(await readFile(migration, 'utf8'));
    await client.query('INSERT INTO "Match" ("id", "stageId") VALUES ($1, $2)', ['existing', 'stage']);
    await client.query('INSERT INTO "Match" ("id", "stageId", "knockoutRound", "knockoutSlot") VALUES ($1, $2, $3, $4)', ['placed', 'stage', 8, 2]);

    for (const [round, slot, code] of [
      [8, null, '23514'],
      [null, 2, '23514'],
      [8, 5, '23514'],
      [8, 2, '23505'],
    ] as const) {
      await client.query('SAVEPOINT invalid_placement');
      try {
        await client.query('INSERT INTO "Match" ("id", "stageId", "knockoutRound", "knockoutSlot") VALUES ($1, $2, $3, $4)', [`invalid-${round}-${slot}`, 'stage', round, slot]);
        throw new Error(`Expected SQLSTATE ${code}`);
      } catch (error) {
        expect((error as { code?: string }).code).toBe(code);
      } finally {
        await client.query('ROLLBACK TO SAVEPOINT invalid_placement');
      }
    }
    const result = await client.query('SELECT "id", "stageId", "knockoutRound", "knockoutSlot" FROM "Match" ORDER BY "id"');
    expect(result.rows).toEqual([
      { id: 'existing', stageId: 'stage', knockoutRound: null, knockoutSlot: null },
      { id: 'placed', stageId: 'stage', knockoutRound: 8, knockoutSlot: 2 },
    ]);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});
