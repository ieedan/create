import { signOut } from '$lib/auth/index';
import type { Actions } from './$types';
 
export const actions: Actions = { default: signOut };