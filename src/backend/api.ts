import { createHash, randomBytes } from 'node:crypto';
//import sgMail from '@sendgrid/mail';
import { D1Database } from '@cloudflare/workers-types';
import { StatusCodes } from 'http-status-codes';
import { AccountType, checkAccountAttribute, isValidAccountAttribute, type Account, type FullAccount } from '../accounts';
import { error } from './utils';

let db: D1Database;

export function setDB(value: D1Database) {
	db = value;
}

export function getDB(): D1Database {
	if (!db) {
		throw error(StatusCodes.SERVICE_UNAVAILABLE, 'Could not access database');
	}
	return db;
}

export function hash(text: string): string {
	const _hash = createHash('sha256');
	_hash.update(text);
	return _hash.digest('hex');
}

export function sendMail(to: string, subject: string, contents: string) {
	/*return sgMail.send({
		from: 'Blankstorm <no-reply@blankstorm.net>',
		to,
		subject,
		html: '<p style="font-family:sans-serif">' + contents.replaceAll('\n', '<br>') + '</p>',
	});*/
	//throw error(StatusCodes.SERVICE_UNAVAILABLE);
}

export function sendMailToUser({ username, email }: { username: string; email?: string }, subject: string, contents: string) {
	if (!email) {
		throw 'Missing email';
	}
	return sendMail(`${username} <${email}>`, subject, `${username},\n\n${contents}\n\nBest,\nThe Blankstorm dev team`);
}

export async function getAccountNum(): Promise<number> {
	return getDB().prepare('select count(1) as num from accounts').first<number>('num');
}
export async function getAccount(attr: string, value: string): Promise<FullAccount> {
	const result = await getAccounts(attr, value, 0, 1);
	return result[0];
}
export async function getAccounts(attr: string, value: string, offset = 0, limit = 1000): Promise<FullAccount[]> {
	if (!value) {
		return [];
	}
	const { results } = await getDB().prepare(`select * from accounts where ${attr}=? limit ?,?`).bind(value, offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}
export async function getAllAccounts(offset = 0, limit = 1000): Promise<FullAccount[]> {
	const { results } = await getDB().prepare('select * from accounts limit ?,?').bind(offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}
export async function getAllAccountsWithMinType(type: AccountType = 4, offset = 0, limit = 1000): Promise<FullAccount[]> {
	const { results } = await getDB().prepare('select * from accounts where type >= ? limit ?,?').bind(type, offset, limit).all<FullAccount>();
	for (const result of results) {
		result.is_disabled = !!result.is_disabled;
	}
	return results;
}
export async function setAccountAttribute(id: string, attr: string, value: string, reason?: string): Promise<void> {
	if (!isValidAccountAttribute(attr as keyof FullAccount, value)) {
		throw 'Invalid key or value';
	}

	const user = await getAccount('id', id);
	if (!user) {
		return;
	}
	switch (attr) {
		case 'username':
			const date = new Date(Date.now());
			getDB().prepare('update accounts set lastchange=? where id=?').bind(date, id).all();
			break;
		case 'disabled':
			await sendMailToUser(
				user,
				'Account ' + (value ? 'disabled' : 'enabled'),
				`Your account has been ${value ? 'disabled' : 'enabled'}.\nReason: ${reason || '<em>no reason provided</em>'}`
			);
			break;
		case 'email':
			await sendMailToUser(
				user,
				'Email changed',
				`Your email has been changed to ${value}. If this was not you, you should change your password and contact support@drvortex.dev.`
			);
			break;
	}

	await getDB().prepare(`update accounts set ${attr}=? where id=?`).bind(value, id).run();
	return;
}
export async function createAccount(username: string, email: string, rawPassword: string): Promise<Account> {
	checkAccountAttribute('username', username);
	checkAccountAttribute('email', email);
	checkAccountAttribute('password', rawPassword);

	if ((await getAccounts('username', username)).length) {
		throw new ReferenceError('User with username already exists');
	}

	if ((await getAccounts('email', email)).length) {
		throw new ReferenceError('User with email already exists');
	}

	const id = randomBytes(16).toString('hex');
	const password = hash(rawPassword);
	const date = new Date(Date.now());

	if ((await getAccounts('id', id)).length) {
		throw new ReferenceError('User with id already exists');
	}

	await getDB().prepare('insert into accounts (id,username,email,password,type,created,lastchange) values (?,?,?,?,0,?,?)').bind(id, username, email, password, date, date).all();

	await sendMailToUser(
		{ username, email },
		'Welcome to Blankstorm',
		`Thank you for joining Blankstorm! The game is still in development, so not all the features are completly finished.
			Make sure you've joined <a href='https://bs.drvortex.dev/discord'>the discord</a> for the latest news!`
	);

	return {
		id,
		is_disabled: false,
		username,
		email,
		type: 0,
		created: date,
		lastchange: date,
	};
}
export async function accountExists(id: string): Promise<boolean> {
	const result = await getDB().prepare('select count(1) as num from accounts where id=?').bind(id).all();
	return !!result[0].num;
}
export async function deleteAccount(id: string, reason?: string): Promise<FullAccount> {
	if (!accountExists(id)) {
		throw new ReferenceError('User does not exist');
	}

	const user = await getAccount('id', id);
	await sendMailToUser(
		user,
		'Account deleted',
		`Your account has been deleted.
		Reason: ${reason || '<em>no reason provided</em>'}
		If you have any concerns please reach out to support@drvortex.dev.`
	);

	return getDB().prepare('delete from accounts where id=?').bind(id).first();
}
export async function login(id: string): Promise<string> {
	const token = randomBytes(32).toString('hex');
	await getDB().prepare('update accounts set token=? where id=?').bind(token, id).first();
	return token;
}
export function logout(id: string, reason?: string): Promise<boolean> {
	return getDB().prepare('update accounts set token="" where id=?').bind(id).first();
}
export async function generateSession(id: string): Promise<string> {
	const session = randomBytes(32).toString('hex');
	await getDB().prepare('update accounts set session=? where id=?').bind(session, id).first();
	return session;
}
