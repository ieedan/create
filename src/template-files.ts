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

export const SVELTEKIT_GIT_IGNORE = `node_modules

# Output
.output
.vercel
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
package-lock.json`;

export const SVELTEKIT_NPMRC = 'engine-strict=true';

export const UNBUILD_CONFIG_FILE = `import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
	entries: ['src/index'],
	failOnWarn: false,
	declaration: true,
	clean: true,
	outDir: '.',
});
`;

export const BIN_FILE = `import { create, util } from 'template-factory';
import fs from 'fs-extra';

const main = async () => {
	const { version, name } = JSON.parse(
		fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8')
	);

	await create({
		appName: name,
		version: version,
		templates: [
			{
				name: 'Notes',
				flag: 'notes',
				path: util.relative('templates/notes', import.meta.url),
			},
		],
	});
};

main();`;

export const TS_CONFIG_FILE = `{
	"compilerOptions": {
		"target": "ESNext",
		"lib": ["ESNext"],
		"module": "ESNext",
		"moduleResolution": "Bundler",
		"resolveJsonModule": true,
		"strict": true,
		"strictNullChecks": true,
		"noEmit": true,
		"esModuleInterop": true,
		"skipDefaultLibCheck": true,
		"skipLibCheck": true
	},
	"exclude": ["node_modules", "templates"]
}
`;

export const PUBLISH_WORKFLOW = `name: Publish to NPM

on:
    release:
        types: [created]

jobs:
    publish:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v3
              with:
                  node-version: '18'
                  registry-url: 'https://registry.npmjs.org'
            - name: Install dependencies
              run: npm install
            - name: Build
              run: npm run build
            - name: Publish
              run: npm publish --access public
              env:
                  NODE_AUTH_TOKEN: \${{secrets.NPM_TOKEN}}
`;