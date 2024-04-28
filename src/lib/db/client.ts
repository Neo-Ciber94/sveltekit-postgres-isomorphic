import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import * as schema from './schema';

const IDB_NAME = 'idb://svelte-db';
let clientDb: PgliteDatabase<typeof schema> | undefined;

export const client = {
	get db() {
		if (clientDb) {
			return clientDb;
		}

		const client = new PGlite(IDB_NAME);
		clientDb = drizzle(client, { schema });
		return clientDb;
	}
};

// Based on: https://github.com/drizzle-team/drizzle-orm/blob/e0aaeb21b14f6027fc5a767d1f4617601650cb06/drizzle-orm/src/sqlite-core/dialect.ts#L727-L728
export async function applyPendingMigrations() {
	const client = new PGlite(IDB_NAME);
	const migrationsTable = '__drizzle_migrations';
	client.exec(`
      CREATE TABLE IF NOT EXISTS ${migrationsTable} (
        id SERIAL PRIMARY KEY,
        created_at numeric
      )
    `);

	const migrationsQueryResult = await client.query<any>(
		`SELECT id, created_at FROM ${migrationsTable} ORDER BY created_at DESC LIMIT 1`
	);
	const lastMigration = migrationsQueryResult.rows[0] ?? undefined;

	try {
		const migrationsMeta = await fetchMigrations();
		let migrationsApplied = 0;

		if (migrationsMeta.length > 0) {
			client.exec(`BEGIN`);

			try {
				for (const migration of migrationsMeta) {
					if (lastMigration == null || Number(lastMigration[2]) < migration.folderMillis) {
						for (const sql of migration.sql) {
							console.log(`📝 Running migration:\n\n${sql}`);
							client.exec(sql);
						}

						await client.query(`INSERT INTO ${migrationsTable} (created_at) VALUES ($1);`, [
							migration.folderMillis
						]);

						migrationsApplied += 1;
					}
				}

				client.exec(`COMMIT`);

				if (migrationsApplied) {
					console.log(`✅ ${migrationsApplied} migrations were applied`);
				}
			} catch (err) {
				client.exec(`ROLLBACK`);
				console.error('❌ Failed to apply migrations', err);
			}
		}
	} catch (err) {
		console.error('Failed to fetch migrations', err);
	}
}

interface MigrationMeta {
	sql: string[];
	folderMillis: number;
}

type Journal = {
	version: string;
	dialect: string;
	entries: {
		idx: number;
		version: string;
		when: number;
		tag: string;
		breakpoints: boolean;
	}[];
};

async function fetchMigrations() {
	const migrationsSqls: MigrationMeta[] = [];

	const res = await fetch('/drizzle/meta/_journal.json');

	if (!res.ok || res.status === 404) {
		throw new Error('"/drizzle/meta/_journal.json" was not found in the public directory');
	}

	const journal: Journal = await res.json();
	const entries = journal.entries.sort((a, b) => a.when - b.when);

	for (const entry of entries) {
		const rawSql = await fetch(`/drizzle/${entry.tag}.sql`).then((x) => x.text());
		const parts = rawSql.split('--> statement-breakpoint').map((x) => x.trim());
		migrationsSqls.push({
			sql: parts,
			folderMillis: entry.when
		});
	}

	return migrationsSqls;
}
