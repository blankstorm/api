import { StatusCodes } from 'http-status-codes';
import { AccountType, stripAccountInfo } from '../../src/accounts';
import { getAccount, getAccounts, getAllAccounts, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkAuth, checkBody, checkParams, error, response } from '../../src/backend/utils';
import { Access } from '../../src/generic';

export { onRequestOptions } from '../../src/backend/utils';

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);

		const body = await checkBody<{
			key: string;
			value: string;
			access: Access;
			multiple: boolean;

			// for all
			all: boolean;
			offset: number;
			limit: number;
		}>(request);
		body.access ||= Access.PUBLIC;

		if (!body.multiple) {
			checkParams(body, 'key', 'value');
			const target = await getAccount(body.key, body.value);

			await checkAuth({
				auth: request,
				requiredType: body.access < Access.PUBLIC ? target.type : AccountType.ACCOUNT,
				target,
				allowIfSame: true,
				access: body.access,
			});

			const result = stripAccountInfo(target, body.access);

			return response(StatusCodes.OK, result);
		}

		await checkAuth({ auth: request, requiredType: AccountType.MOD });

		if (body.all) {
			const accounts = await getAllAccounts(body.offset, body.limit);
			return response(
				StatusCodes.OK,
				accounts.map(account => stripAccountInfo(account, body.access))
			);
		}

		checkParams(body, 'key', 'value');
		const accounts = await getAccounts(body.key, body.value);
		return response(
			StatusCodes.OK,
			accounts.map(account => stripAccountInfo(account, body.access))
		);
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
