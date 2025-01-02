import { StatusCodes } from 'http-status-codes';
import type { RequestContext } from '../src/backend/context';
import { error, response } from '../src/backend/utils';

export async function onRequest({ env }: RequestContext) {
	try {
		return response(StatusCodes.OK, 'User-agent: *\nDisallow: /', false);
	} catch (e: any) {
		console.error(e);
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
