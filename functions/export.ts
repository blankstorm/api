import { StatusCodes } from 'http-status-codes';
import { AccountType } from '../src/accounts';
import { getDB, setDB } from '../src/backend/api';
import type { RequestContext } from '../src/backend/context';
import { checkAuth, error } from '../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);
		const db = getDB();
		const url = new URL(request.url);

		await checkAuth({
			auth: url.searchParams.get('auth'),
			requiredType: AccountType.ADMIN,
		});

		let dump = '';
		const { results: schema } = await db.prepare('SELECT name,sql FROM sqlite_master').all<Record<string, string>>();
		for (const { name, sql } of schema) {
			if (name.startsWith('_')) {
				continue;
			}
			dump += `DROP TABLE IF EXISTS ${name};\n${sql};\n`;
			const { results: data } = await db.prepare('SELECT * FROM ' + name).all();
			dump += `INSERT INTO ${name} (${Object.keys(data[0]).join(',')}) VALUES\n`;
			dump +=
				data
					.map(
						row =>
							`(${Object.values(row)
								.map(value => JSON.stringify(value))
								.join(',')})`
					)
					.join(',\n') + ';\n';
		}

		return new Response(dump, {
			headers: {
				'Content-Type': 'text/sql',
			},
		});
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
