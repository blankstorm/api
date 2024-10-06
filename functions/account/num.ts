import { StatusCodes } from 'http-status-codes';
import { getAccountNum, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { error, response } from '../../src/backend/utils';

export { onRequestOptions } from '../../src/backend/utils';

export async function onRequest({ env }: RequestContext) {
	try {
		setDB(env.DB);
		return response(StatusCodes.OK, await getAccountNum(), false);
	} catch (e: any) {
		console.error(e);
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
