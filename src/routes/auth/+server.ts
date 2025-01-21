import { error, json, type Cookies, type RequestHandler } from '@sveltejs/kit';
import { OAuth2Client, type Credentials } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';

const client = new OAuth2Client({
	clientId: GOOGLE_CLIENT_ID,
	clientSecret: GOOGLE_CLIENT_SECRET
});

function storeAuthTokens(tokens: Credentials, cookies: Cookies) {
	cookies.set('auth_tokens', JSON.stringify(tokens), {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 1 week
	});
}

async function getUserData(tokens: Credentials, cookies: Cookies) {
	if (!tokens?.id_token && !tokens?.refresh_token) throw error(400, 'No tokens provided');

	try {
		const ticket = await client.verifyIdToken({
			idToken: tokens.id_token!,
			audience: GOOGLE_CLIENT_ID
		});
		return ticket.getPayload();
	} catch {
		client.setCredentials(tokens);
		const { credentials } = await client.refreshAccessToken();
		tokens = credentials;
		if (!tokens.id_token) throw error(400, 'Failed to refresh tokens');
		storeAuthTokens(tokens, cookies);
		return getUserData(tokens, cookies);
	}
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { code, state } = await request.json();

	// Verify state to prevent CSRF attacks
	const storedState = cookies.get('oauth_state');

	if (!state || state !== storedState) {
		throw error(400, 'Invalid state parameter');
	}

	try {
		const { tokens } = await client.getToken({
			code,
			redirect_uri: `${request.headers.get('origin')}/settings`
		});
		storeAuthTokens(tokens, cookies);

		const user = await getUserData(tokens, cookies);

		return json({ ...user, access_token: tokens.access_token });
	} catch (err) {
		throw error(400, 'Failed to sign in: ' + err);
	}
};

export const GET: RequestHandler = async ({ cookies }) => {
	const tokensStr = cookies.get('auth_tokens');

	if (!tokensStr) {
		return json(null);
	}

	try {
		const tokens = JSON.parse(tokensStr);

		const user = await getUserData(tokens, cookies);

		return json({ ...user, access_token: tokens.access_token });
	} catch {
		cookies.delete('auth_tokens', { path: '/' });
		return json(null);
	}
};
