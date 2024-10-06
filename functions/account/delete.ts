import { StatusCodes } from 'http-status-codes';
import { AccountType } from '../../src/accounts';
import { deleteAccount, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkAuth, checkBody, error, getAccountFromTokenOrID, response } from '../../src/backend/utils';

export { onRequestOptions } from '../../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);

		const body = await checkBody<{ id: string; token: string; reason: string }>(request);

		const target = await getAccountFromTokenOrID(body);

		await checkAuth({
			auth: request,
			requiredType: AccountType.ADMIN,
			target,
			allowIfSame: true,
		});

		await deleteAccount(target.id, body.reason);

		return response(StatusCodes.OK);
	} catch (e: any) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
