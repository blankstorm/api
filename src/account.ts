import { request } from './request';

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
	oplvl: Type;
	lastchange: string;
	created: string;
	disabled: boolean;
	token?: string;
	session?: string;
}

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

/**
 * Parses the account result of a response
 * @param result the response result
 * @returns the parsed result
 */
function parseAccount(result: Result): Account {
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
	return parsed;
}

/**
 * Logs an account in
 * @param email the account's email
 * @param password the account's password
 * @returns The logged in account's data (includes the token)
 */
export async function login(email: string, password: string): Promise<Account> {
	const result = await request<Result>('POST', 'account', { action: 'login', email, password });
	return parseAccount(result);
}

/**
 * Logs an account out
 * @param token the account's login token
 * @param reason why the account is being logged out (Requires authenication)
 * @returns The logged out accounts data
 */
export async function logout(id: string, reason?: string): Promise<Account> {
	const result = await request<Result>('POST', 'account', { action: 'logout', id, reason });
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
	const result = await request<Result>('POST', 'account', { action: 'create', email, username, password });
	return parseAccount(result);
}

/**
 * Deletes an account (Requires authenication)
 * @param id the ID of the account to delete
 */
async function _delete(id: string): Promise<void> {
	await request<void>('POST', 'account', { action: 'delete', id });
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
	const result = await request<Result>('GET', 'account', { action: 'get', [key]: value });
	return parseAccount(result);
}
