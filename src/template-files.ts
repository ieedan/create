/** Returns the svelte.config.js file for IIS deployment environments*/
export const iisSvelteConfig = (projectName: string) => {
	return `import IISAdapter from 'sveltekit-adapter-iis';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    kit: {
        // IIS Adapter https://github.com/abaga129/sveltekit-adapter-iis
        adapter: IISAdapter({
            iisNodeOptions: {
                nodeProcessCommandLine: 'C:\\Program Files\\nodejs\\node.exe',
                logDirectory: 'C:\\${projectName}\\logs',
                loggingEnabled: true,
            },
        }),
    }
};

export default config;`;
};

/** svelte.config.js file for Vercel deployment environments*/
export const SVELTE_CONFIG_FILE_VERCEL = `import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
// Consult https://kit.svelte.dev/docs/integrations#preprocessors
// for more information about preprocessors
preprocess: vitePreprocess(),

kit: {
adapter: adapter({
    // See docs https://kit.svelte.dev/docs/adapter-vercel
})
}
};

export default config;`;

/** hooks.client.ts file for Vercel analytics */
export const VERCEL_ANALYTICS_HOOKS_CLIENT_TS = `import { dev } from "$app/environment";
import { inject } from "@vercel/analytics";

inject({ mode: dev ? "development" : "production" });`;

/** hooks.client.ts file for Vercel speed insights */
export const VERCEL_SPEED_INSIGHTS_HOOKS_CLIENT_TS = `import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";

injectSpeedInsights();`;
