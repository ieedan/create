import IISAdapter from 'sveltekit-adapter-iis';
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

export default config;