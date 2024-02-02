import { StatusCodes } from 'http-status-codes';
import { response } from '../src/backend/utils';

export function onRequest(): Response {
	return response(StatusCodes.OK, {});
}
