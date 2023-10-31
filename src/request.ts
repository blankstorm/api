import { authToken } from './auth.js';

/**
 * The base API URL
 */
export let URL = 'https://api.blankstorm.net';

/**
 * Sets the API's URL
 * @param value The new URL
 */
export function setURL(value: string) {
	URL = value;
}

/**
 * A response to an API request
 */
export interface Response<Result> {
	/**
	 * The HTTP status of the response
	 */
	status: number;

	/**
	 * The HTTP status' text
	 */
	statusText: string;

	/**
	 * Whether the request failed (true) or not (false)
	 */
	error: boolean;

	/**
	 * The result of the request.
	 *
	 * @remarks
	 * If the request fails, result will contain the error message
	 */
	result: Result;
}

/**
 * Makes a request to the API
 * @param method Which HTTP method to use with the request
 * @param endpoint The API endpoint to send the request to
 * @param data The data to include in the request
 * @returns a Promise which resolves to the result of the response
 */
export async function request<R>(method: string, endpoint: string, data: object = {}): Promise<R> {
	const res = await fetch(`${URL}/${endpoint}`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...data, auth: authToken }),
	});
	const response: Response<R> = await res.json();
	if (response.error) {
		throw response.result;
	}

	return response.result;
}
