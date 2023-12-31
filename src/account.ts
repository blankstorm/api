import { Access } from './auth.js';
import { request } from './request.js';
import type { KeyValue } from './utils.js';

export const uniqueAccountAttributes = ['id', 'username', 'email', 'token', 'session'];

export const accountAttributes = [...uniqueAccountAttributes, 'type', 'lastchange', 'created', 'is_disabled'];

/**
 * The account's level of access and status
 */
export enum AccountType {
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
export interface AccountResult {
	id: string;
	username: string;
	email?: string;
	type: AccountType;
	lastchange: string;
	created: string;
	is_disabled: boolean;
	token?: string;
	session?: string;
}

/**
 * The result object of a response representing an account with all data
 * @see FullAccount
 */
export interface FullAccountResult extends AccountResult {
	email: string;
	token: string;
	session: string;
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
	type: AccountType;

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
	is_disabled: boolean;

	/**
	 * The login token of the account
	 */
	token?: string;

	/**
	 * The session token of the account
	 */
	session?: string;

	/**
	 * The account's password hash.
	 *
	 * This is ***never*** sent by the server, it is only here for code convience when updating the password.
	 */
	password?: string;
}

/**
 * Represents an account with all data (i.e. sensitive information must be included)
 */
export interface FullAccount extends Account {
	email: string;
	token: string;
	session: string;
	password?: string;
}

export type UniqueAccountKey = 'id' | 'email' | 'username' | 'token' | 'session';

/**
 * Parses the account result of a response
 * @param result the response result
 * @returns the parsed result
 */
function parseAccount<A extends Account>(result: AccountResult): A {
	const parsed: Account = {
		id: result?.id,
		username: result?.username,
		type: result?.type,
		lastchange: new Date(result?.lastchange),
		created: new Date(result?.created),
		is_disabled: result?.is_disabled,
	};
	for (const maybe of ['token', 'session', 'email']) {
		if (maybe in result) {
			parsed[maybe] = result[maybe];
		}
	}
	return parsed as A;
}

/**
 * The roles of account types
 */
export const accountRoles: { [key in AccountType]: string } & string[] = ['User', 'Moderator', 'Developer', 'Administrator', 'Owner'];

/**
 * Gets a string describing the role of the account type
 * @param type the acccount type
 * @param short whether to use the short form or not
 * @returns the role
 */
export function getAccountRole(type: AccountType, short?: boolean): string {
	if (typeof accountRoles[type] != 'string') {
		return 'Unknown' + (short ? '' : ` (${type})`);
	}
	if (!short) {
		return accountRoles[type];
	}
	switch (type) {
		case AccountType.MODERATOR:
			return 'Mod';
		case AccountType.DEVELOPER:
			return 'Dev';
		case AccountType.ADMINISTRATOR:
			return 'Admin';
		default:
			return accountRoles[type];
	}
}

/**
 * Strips private information (e.g. email, password hash, etc.) from an account
 * @param account the account to strip info from
 * @returns a new object without the stripped info
 */
export function stripAccountInfo(account: Account, access: Access = Access.PUBLIC): Account {
	const info = {
		id: account.id,
		username: account.username,
		type: account.type,
		lastchange: account.lastchange,
		created: account.created,
		is_disabled: account.is_disabled,
	};
	if (access == Access.PUBLIC) {
		return info;
	}
	Object.assign(info, {
		email: account.email,
		token: account.token,
		session: account.session,
	});
	if (access == Access.PROTECTED || access == Access.PRIVATE) {
		return info;
	}

	throw new Error('Invalid access level: ' + access);
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 */
export function checkAccountAttribute<K extends keyof FullAccount>(key: K, value: FullAccount[K]): void {
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
		case 'type':
			if (typeof _value != 'number') throw new TypeError('Account type is not a number');
			if (_value < AccountType.ACCOUNT || _value > AccountType.OWNER) throw new RangeError('Account type is not valid');
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
		case 'is_disabled':
			if (![true, false, 1, 0, 'true', 'false'].some(v => v === _value)) throw new Error('Invalid disabled value');
			break;
		case 'password':
			break;
		default:
			throw new TypeError(`"${key}" is not an account attribute`);
	}
}

/**
 * Checks if `value` is a valid `key`
 * @param key The attribute to check
 * @param value The value
 * @returns whether the value is valid
 */
export function isValidAccountAttribute<K extends keyof FullAccount>(key: K, value: FullAccount[K]): boolean {
	try {
		checkAccountAttribute(key, value);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Gets the current number of accounts
 */
export async function getAccountNum(): Promise<number> {
	const result = await request<number>('GET', 'account/num');
	return result;
}

/**
 * Logs an account in
 * @param email the account's email
 * @param password the account's password
 * @returns The logged in account's data (includes the token)
 */
export async function login(email: string, password: string): Promise<Account & { token: string }> {
	checkAccountAttribute('email', email);
	const result = await request<AccountResult>('POST', 'account/login', { email, password });
	return parseAccount<Account & { token: string }>(result);
}

/**
 * Logs an account out
 * @param id the account's id
 * @param reason why the account is being logged out (Requires authenication)
 * @returns True when successful
 */
export async function logout(id: string, reason?: string): Promise<boolean> {
	checkAccountAttribute('id', id);
	return await request<boolean>('POST', 'account/logout', { id, reason });
}

/**
 * Creates a new account
 * @param email the account's email
 * @param username the account's username
 * @param password the account's password
 * @returns The created account's data
 */
export async function createAccount(email: string, username: string, password: string): Promise<Account> {
	checkAccountAttribute('email', email);
	checkAccountAttribute('username', username);
	const result = await request<AccountResult>('POST', 'account/create', { email, username, password });
	return parseAccount(result);
}

/**
 * Deletes an account (Requires authenication)
 * @param id the ID of the account to delete
 */
export async function deleteAccount(id: string, reason?: string): Promise<void> {
	checkAccountAttribute('id', id);
	await request<void>('POST', 'account/delete', { id, reason });
	return;
}

/**
 * Gets info about an account
 * @param id the account's id
 * @param key the key to identify the account with (e.g. id)
 * @param value the value of the key (e.g. the account's id)
 * @param access which level of access
 * @returns The account's data
 */
export async function getAccount(id: string, access?: Access): Promise<Account>;
export async function getAccount(key: UniqueAccountKey, value?: string, access?: Access): Promise<Account>;
export async function getAccount(key: string, value?: string | Access, access?: Access): Promise<Account> {
	if (!accountAttributes.includes(key)) {
		if (typeof value == 'number') {
			access = value;
		}
		[key, value] = ['id', key];
	}

	checkAccountAttribute(key as UniqueAccountKey, value as string);
	const result = await request<AccountResult>('POST', 'account/info', { key, value, access, multiple: false });
	return parseAccount(result);
}

/**
 * Gets info about accounts (Requires authorization: Mod)
 * @param key the key to identify accounts with (e.g. id)
 * @param value the value of the key (e.g. the accounts role)
 * @returns The accounts
 */
export async function getAccounts(key: string, value?: string, offset = 0, limit = 1000): Promise<Account[]> {
	checkAccountAttribute(key as keyof FullAccount, value);
	const results = await request<AccountResult[]>('POST', 'account/info', { key, value, multiple: true });
	return results.map(result => parseAccount(result));
}

/**
 * Gets info about all account (Requires authorization: Mod)
 * @returns The accounts
 */
export async function getAllAccounts(offset = 0, limit = 1000): Promise<Account[]> {
	const results = await request<AccountResult[]>('POST', 'account/info', { multiple: true, all: true, offset, limit });
	return results.map(result => parseAccount(result));
}

/**
 * Updates an attribute of an account
 * @param id the account's id
 * @param key which attribute to update
 * @param value the new value
 * @param reason the reason for the change
 * @returns the updated account data
 */
export async function update<K extends keyof FullAccount>(id: string, key: K, value: FullAccount[K], reason?: string): Promise<Account> {
	checkAccountAttribute('id', id);
	checkAccountAttribute(key, value);
	const result = await request<AccountResult>('POST', 'account/update', { id, key, value, reason });
	return parseAccount(result);
}

/**
 * Disables an account
 * @param id the account's id
 * @param reason why the account is being disabled (Requires authenication)
 * @returns True when successful
 */
export async function disable(id: string, reason?: string): Promise<boolean> {
	const account = await update(id, 'is_disabled', true, reason);
	return account.is_disabled;
}

/**
 * Enables an account
 * @param id the account's id
 * @param reason why the account is being enabled (Requires authenication)
 * @returns True when successful
 */
export async function enable(id: string, reason?: string): Promise<boolean> {
	const account = await update(id, 'is_disabled', false, reason);
	return !account.is_disabled;
}
