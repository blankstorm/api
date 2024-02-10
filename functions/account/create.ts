import { StatusCodes } from 'http-status-codes';
import type { Account } from '../../src/accounts';
import { createAccount, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkBody, error, parseError, response } from '../../src/backend/utils';

export { onRequestOptions } from '../../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);
		const body = await checkBody(request, 'username', 'email', 'password');

		let newUser: Account;
		try {
			newUser = await createAccount(body.username, body.email, body.password);
		} catch (err) {
			return parseError(err);
		}

		return response(StatusCodes.OK, newUser);
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
