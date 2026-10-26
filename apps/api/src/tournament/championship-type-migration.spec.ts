import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const migration = new URL('../../prisma/migrations/20261026144500_championship_type/migration.sql', import.meta.url);
const testWithDatabase = process.env.DATABASE_URL ? it : it.skip;

testWithDatabase('championship type migration classifies existing editions without changing names', async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA migration_test');
    await client.query('SET LOCAL search_path TO migration_test, public');
    await client.query('CREATE TABLE "Championship" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL)');
    await client.query('INSERT INTO "Championship" ("id", "name") VALUES ($1, $2), ($3, $4)', [
      'copa', 'Copa América 2024', 'world', 'Mundial 2024',
    ]);
    await client.query(await readFile(migration, 'utf8'));
    const result = await client.query('SELECT "id", "name", "type" FROM "Championship" ORDER BY "id"');
    expect(result.rows).toEqual([
      { id: 'copa', name: 'Copa América 2024', type: 'COPA_AMERICA' },
      { id: 'world', name: 'Mundial 2024', type: 'WORLD_CUP' },
    ]);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});

testWithDatabase('championship type migration refuses unknown categories without changing stored rows', async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA migration_test');
    await client.query('SET LOCAL search_path TO migration_test, public');
    await client.query('CREATE TABLE "Championship" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL)');
    await client.query('INSERT INTO "Championship" ("id", "name") VALUES ($1, $2)', [
      'other', 'Copa Libertadores 2024',
    ]);
    await client.query('SAVEPOINT before_migration');
    await expect(client.query(await readFile(migration, 'utf8'))).rejects.toThrow(
      /Cannot classify every existing championship/,
    );
    await client.query('ROLLBACK TO SAVEPOINT before_migration');
    const result = await client.query('SELECT "id", "name" FROM "Championship"');
    expect(result.rows).toEqual([{ id: 'other', name: 'Copa Libertadores 2024' }]);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});
