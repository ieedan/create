import { redirect, type Handle } from '@sveltejs/kit';
import { handle as authenticationHandle, getRedirectTo } from '$lib/auth';
import { sequence } from '@sveltejs/kit/hooks';

const authorizationHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/dashboard')) {
		const session = await event.locals.auth();
		if (!session) {
			throw redirect(
				303,
				`/signin?redirectTo=${getRedirectTo(event.url)}`
			);
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(authenticationHandle, authorizationHandle);
