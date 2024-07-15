import { StatusCodes } from 'http-status-codes';
import { version } from '../package.json';
import type { RequestContext } from '../src/backend/context';
import { error, response } from '../src/backend/utils';
import type { Metadata } from '../src/generic';

export async function onRequest({ env }: RequestContext) {
	try {
		const metadata: Metadata = {
			version,
			debug: !!env.DEBUG,
		};
		return response(StatusCodes.OK, metadata, false);
	} catch (e) {
		console.error(e);
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
