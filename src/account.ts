import { request } from './request';
import type { KeyValue } from './utils';

/**
 * account actions
 */
export type Action = 'get' | 'set' | 'create' | 'delete' | 'login' | 'logout';

/**
 * The account's level of access and status
 */
export enum Type {
	/**
	 * Standard accounts
	 */
	ACCOUNT = 0,
	MODERATOR = 1,

	/**
	 * Alias for MODERATOR
	 */
	MOD = 1,

	DEVELOPER = 2,

	/**
	 * Alias for DEVELOPER
	 */
	DEV = 2,

	ADMINISTRATOR = 3,

	/**
	 * Alias for ADMINISTRATOR
	 */
	ADMIN = 3,

	OWNER = 4,
}

/**
 * The result object of a response representing an account
 * @see Account
 */
export interface Result {
	id: string;
	username: string;
	email?: string;
	oplvl: Type;
	lastchange: string;
	created: string;
	disabled: boolean;
	token?: string;
	session?: string;
}

export type FullResult = Result & { email: string; password: string; token: string; session: string };

/**
 * Represents an account
 */
export interface Account {
	/**
	 * The ID of the account
	 */
	id: string;

	/**
	 * The username of the account
	 */
	username: string;

	/**
	 * The email of the account
	 */
	email?: string;

	/**
	 * The type of the account
	 */
	oplvl: Type;

	/**
	 * The last time the account's username was changed
	 */
	lastchange: Date;

	/**
	 * When the account was created
	 */
	created: Date;

	/**
	 * If the account is currently disabled
	 */
	disabled: boolean;

	/**
	 * The login token of the account
	 */
	token?: string;

	/**
	 * The session token of the account
	 */
	session?: string;
}

export type FullAccount = Account & { email: string; password: string; token: string; session: string };

/**
 * Parses the account result of a response
 * @param result the response result
 * @returns the parsed result
 */
function parseAccount<A extends Account>(result: Result): A {
	const parsed: Account = {
		id: result?.id,
		username: result?.username,
		oplvl: result?.oplvl,
		lastchange: new Date(result?.lastchange),
		created: new Date(result?.created),
		disabled: result?.disabled,
	};
	if ('token' in result) {
		parsed.token = result.token;
	}
	if ('session' in result) {
		parsed.session = result.session;
	}
	return parsed as A;
}

/**
 * Logs an account in
 * @param email the account's email
 * @param password the account's password
 * @returns The logged in account's data (includes the token)
 */
export async function login(email: string, password: string): Promise<Account & { token: string }> {
	checkValid('email', email);
	checkValid('password', password);
	const result = await request<Result>('POST', 'user', { action: 'login', email, password });
	return parseAccount<Account & { token: string }>(result);
}

/**
 * Logs an account out
 * @param token the account's login token
 * @param reason why the account is being logged out (Requires authenication)
 * @returns The logged out accounts data
 */
export async function logout(id: string, reason?: string): Promise<Account> {
	checkValid('id', id);
	const result = await request<Result>('POST', 'user', { action: 'logout', id, reason });
	return parseAccount(result);
}

/**
 * Creates a new account
 * @param email the account's email
 * @param username the account's username
 * @param password the account's password
 * @returns The created account's data
 */
export async function create(email: string, username: string, password: string): Promise<Account> {
	checkValid('email', email);
	checkValid('username', username);
	checkValid('password', password);
	const result = await request<Result>('POST', 'user', { action: 'create', email, username, password });
	return parseAccount(result);
}

/**
 * Deletes an account (Requires authenication)
 * @param id the ID of the account to delete
 */
async function _delete(id: string): Promise<void> {
	checkValid('id', id);
	await request<void>('POST', 'user', { action: 'delete', id });
	return;
}
export { _delete as delete };

/**
 * Requests info about an account
 * @param key the key to identify the account with (e.g. id)
 * @param value the value of the key (e.g. the account's id)
 * @returns The account's data
 */
export async function info(key: string, value: string): Promise<Account> {
	checkValid(key as keyof FullAccount, value);
	const result = await request<Result>('GET', 'user', { action: 'get', [key]: value });
	return parseAccount(result);
}

/**
 * The roles of account types
 */
export const roles: { [key in Type]: string } & string[] = ['User', 'Moderator', 'Developer', 'Administrator', 'Owner'];

/**
 * Gets a string describing the role of the account type
 * @param type the acccount type
 * @param short whether to use the short form or not
 * @returns the role
 */
export function getRole(type: Type, short?: boolean): string {
	switch (type) {
		case Type.ACCOUNT:
			return roles[0];
		case Type.MODERATOR:
			return short ? 'Mod' : roles[1];
		case Type.DEVELOPER:
			return short ? 'Dev' : roles[2];
		case Type.ADMINISTRATOR:
			return short ? 'Admin' : roles[3];
		case Type.OWNER:
			return roles[4];
		default:
			return 'Unknown' + (short ? '' : ` (${type})`);
	}
}

/**
 * Strips private information (e.g. email, password hash, etc.) from an account
 * @param account the account to strip info from
 * @returns a new object without the stripped info
 */
export function stripInfo(account: FullAccount): Account {
	return {
		id: account.id,
		username: account.username,
		oplvl: account.oplvl,
		lastchange: account.lastchange,
		created: account.created,
		disabled: account.disabled,
	};
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param _value The value
 */
export function checkValid<K extends keyof FullAccount>(key: K, value: FullAccount[K]): void {
	const [_key, _value] = [key, value] as KeyValue<FullAccount>;
	switch (_key) {
		case 'id':
			if (_value.length != 32) throw new Error('Invalid ID length');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid ID');
			break;
		case 'username':
			if (_value.length < 3 || _value.length > 20) throw new Error('Usernames must be between 3 and 20 characters.');
			if (!/^[_0-9a-zA-Z]+$/.test(_value)) throw new Error('Usernames can only contain letters, numbers, and underscores');
			break;
		case 'email':
			if (!/^[\w.-]+@[\w-]+(\.\w{2,})+$/.test(_value)) throw new Error('Invalid email');
			break;
		case 'lastchange':
		case 'created':
			if (_value.getTime() > Date.now()) {
				throw new Error('Date is in the future');
			}
			break;
		case 'token':
		case 'session':
			if (_value.length != 64) throw new Error('Invalid token or session');
			if (!/^[0-9a-f]+$/.test(_value)) throw new Error('Invalid token or session');
			break;
		case 'disabled':
			if (![true, false, 1, 0, 'true', 'false'].some(v => v === _value)) throw new Error('Invalid disabled value');
			break;
		case 'password':
			break;
		default:
			throw new TypeError(`"${key}" is not a user attribute`);
	}
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 * @returns whether the value is valid
 */
export function isValid<K extends keyof FullAccount>(key: K, value: FullAccount[K]): boolean {
	try {
		checkValid(key, value);
		return true;
	} catch (e) {
		return false;
	}
}
