import { SvelteKitAuth } from '@auth/sveltekit';
 
export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [],
});