import { StatusCodes } from 'http-status-codes';
import { AccountType } from '../../src/accounts';
import { logout, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkAuth, checkBody, error, getAccountFromTokenOrID, parseError, response } from '../../src/backend/utils';

export { onRequestOptions } from '../../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);

		const body = await checkBody<{ id: string; token: string; reason: string }>(request);

		const target = await getAccountFromTokenOrID(body);

		await checkAuth({
			auth: request,
			requiredType: AccountType.MOD,
			target,
			allowIfSame: true,
		});

		try {
			await logout(target.id, body.reason);
		} catch (err: any) {
			return parseError(err);
		}

		return response(StatusCodes.OK, true);
	} catch (e: any) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
