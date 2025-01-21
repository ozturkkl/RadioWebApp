import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GOOGLE_CLIENT_ID } from '$env/static/private';

export const POST: RequestHandler = async ({ request, url }) => {
	const data = await request.json();
	const state = data?.state;
	const prompt = data?.prompt;
	if (!state) {
		throw error(400, 'No state provided');
	}

	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: `${url.origin}/settings`,
		response_type: 'code',
		scope: 'email https://www.googleapis.com/auth/drive.appdata',
		state,
		access_type: 'offline'
	});

	if (prompt) {
		params.append('prompt', 'consent');
	}

	const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

	return json({ authUrl });
};
