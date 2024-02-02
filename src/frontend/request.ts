import { authToken } from './auth.js';

export const config = {
	/**
	 * The base API URL
	 */
	url: 'https://api.blankstorm.net',

	/**
	 * Whether to throw an error on erroneous responses
	 */
	throw_errors: true,
};

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
	const init: RequestInit = {
		method,
		headers: {
			Authorization: 'Bearer ' + authToken,
			'Content-Type': 'application/json',
		},
	};
	if (!['get', 'head'].includes(method.toLowerCase())) {
		init.body = JSON.stringify({ ...data });
	}
	const res = await fetch(`${config.url}/${endpoint}`, init);
	const response: Response<R> = await res.json();
	if (response.error && config.throw_errors) {
		throw response.result;
	}

	return response.result;
}
