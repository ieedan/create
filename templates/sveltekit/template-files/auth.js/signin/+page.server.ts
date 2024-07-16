import { signIn } from '$lib/auth/index';
import type { Actions } from './$types';
 
export const actions: Actions = { default: signIn };