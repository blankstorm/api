import { StatusCodes } from 'http-status-codes';
import { AccountType, accountAttributes, stripAccountInfo, type FullAccount } from '../../src/accounts';
import { setAccountAttribute, setDB } from '../../src/backend/api';
import type { RequestContext } from '../../src/backend/context';
import { checkAuth, checkBody, error, getAccountFromTokenOrID, parseError, response } from '../../src/backend/utils';
import { Access } from '../../src/generic';

export { onRequestOptions } from '../../src/backend/utils';

const requiredTypeForChange: { [K in keyof FullAccount]: AccountType } = {
	...(Object.fromEntries(accountAttributes.map(k => [k, AccountType.MOD])) as { [K in keyof FullAccount]: AccountType.MOD }),
	username: AccountType.DEV,
	email: AccountType.DEV,
	is_disabled: AccountType.MOD,
	type: AccountType.ADMIN,
};

export async function onRequest({ env, request }: RequestContext): Promise<Response> {
	try {
		setDB(env.DB);
		const body = await checkBody<{
			key: keyof FullAccount;
			value: string;
			id: string;
			token: string;
			reason: string;
		}>(request, 'key', 'value');

		const target = await getAccountFromTokenOrID(body);

		await checkAuth({
			auth: request,
			target,
			allowIfSame: ['username', 'email'].includes(body.key),
			requiredType: requiredTypeForChange[body.key],
			access: Access.PROTECTED,
		});

		try {
			await setAccountAttribute(target.id, body.key, body.value, body.reason);
		} catch (err) {
			throw parseError(err);
		}

		return response(StatusCodes.OK, stripAccountInfo(target));
	} catch (e) {
		if (e instanceof Response) {
			return e;
		}
		return error(StatusCodes.INTERNAL_SERVER_ERROR, env.DEBUG && e?.message);
	}
}
