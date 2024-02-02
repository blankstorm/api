import { StatusCodes } from 'http-status-codes';
import { stripAccountInfo } from '../../src/accounts';
import { getAccount, hash, login, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkBody, error, parseError, response } from '../../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);

		const body = await checkBody(request, 'email', 'password');

		const account = await getAccount('email', body.email);

		if (!account) {
			return error(StatusCodes.NOT_FOUND, 'Account does not exist');
		}

		if (account.is_disabled) {
			return error(StatusCodes.FORBIDDEN, 'Account is disabled');
		}

		if (account.password != hash(body.password)) {
			return error(StatusCodes.FORBIDDEN, 'Bad password');
		}

		let token;
		try {
			token = await login(account.id);
		} catch (err) {
			return parseError(err);
		}

		return response(StatusCodes.OK, { ...stripAccountInfo(account), token });
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
