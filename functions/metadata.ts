import { StatusCodes } from 'http-status-codes';
import { setDB } from '../src/backend/api';
import type { RequestContext } from '../src/backend/context';
import { error, response } from '../src/backend/utils';
import { version } from '../package.json';

export async function onRequest({ env }: RequestContext) {
	try {
		setDB(env.DB);
		return response(
			StatusCodes.OK,
			{
				version,
				debug: !!env.DEBUG,
			},
			false
		);
	} catch (e) {
		console.error(e);
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
