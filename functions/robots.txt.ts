import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export async function onRequest() {
	try {
		return new Response('User-agent: *\nDisallow: /', {
			status: StatusCodes.OK,
			statusText: ReasonPhrases.OK,
			headers: {
				'access-control-allow-origin': '*',
				'content-type': 'text/plain; charset=utf-8',
			},
		});
	} catch {
		return new Response(null, {
			status: StatusCodes.OK,
			statusText: ReasonPhrases.OK,
			headers: {
				'access-control-allow-origin': '*',
				'content-type': 'text/plain; charset=utf-8',
			},
		});
	}
}
