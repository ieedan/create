import fs from 'fs-extra';
import path from 'node:path';
import * as template from 'ez-templates';
import { execa } from 'execa';
import type { Prompt, Template } from 'ez-templates';
import { PM, detect } from 'detect-package-manager';

const main = async () => {
	// detect package manager
	const pm = await detect();

	// define the project templates inside of ./templates here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			path: 'templates/sveltekit',
			excludeFiles: ['README.md', 'package-lock.json'],
			prompts: [
				{
					kind: 'select',
					message: 'What is your deployment environment?',
					options: [
						{
							name: 'Auto',
							select: {
								run: async ({}) => {
									// do nothing its already setup
								},
								startMessage: 'Setting up @sveltejs/adapter-auto',
								endMessage: 'Setup @sveltejs/adapter-auto',
							},
						},
						{
							name: 'Vercel',
							select: {
								run: async ({ dir }) => {
									await removeDependency('@sveltejs/adapter-auto', { pm, dir });

									await execa({
										cwd: dir,
									})`${pm} install --save-dev --package-lock-only --no-package-lock @sveltejs/adapter-vercel`;

									const config = `import adapter from '@sveltejs/adapter-vercel';
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

									await fs.writeFile(path.join(dir, 'svelte.config.js'), config);

									return [
										{
											message: 'Should we add any other Vercel features?',
											kind: 'multiselect',
											options: [
												{
													name: '@vercel/analytics',
													select: {
														run: async ({ dir }) => {
															await execa({
																cwd: dir,
															})`${pm} install --save-dev --package-lock-only --no-package-lock @vercel/analytics`;

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const code = `import { dev } from "$app/environment";
import { inject } from "@vercel/analytics";

inject({ mode: dev ? "development" : "production" });`;

																await fs.writeFile(hooksPath, code);
															} else {
																let code = (
																	await fs.readFile(hooksPath)
																).toString();

																code =
																	`import { dev } from "$app/environment";\r\nimport { inject } from "@vercel/analytics";\r\n` +
																	code +
																	'\r\ninject({ mode: dev ? "development" : "production" });';

																await fs.writeFile(hooksPath, code);
															}
														},
														startMessage:
															'Setting up @vercel/analytics',
														endMessage: 'Setup @vercel/analytics',
													},
												},
												{
													name: '@vercel/speed-insights',
													select: {
														run: async ({ dir }) => {
															await execa({
																cwd: dir,
															})`${pm} install --save-dev --package-lock-only --no-package-lock @vercel/speed-insights`;

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const code = `import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";

injectSpeedInsights();`;

																await fs.writeFile(hooksPath, code);
															} else {
																let code = (
																	await fs.readFile(hooksPath)
																).toString();

																code =
																	`import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";\r\n` +
																	code +
																	'\r\ninjectSpeedInsights();';

																await fs.writeFile(hooksPath, code);
															}
														},
														startMessage:
															'Setting up @vercel/speed-insights',
														endMessage: 'Setup @vercel/speed-insights',
													},
												},
											],
										},
									];
								},
								startMessage: 'Setting up @sveltejs/adapter-vercel',
								endMessage: 'Setup @sveltejs/adapter-vercel',
							},
						},
						{
							name: 'IIS',
							select: {
								run: async ({ dir, projectName }) => {
									await removeDependency('@sveltejs/adapter-auto', { pm, dir });

									await execa({
										cwd: dir,
									})`${pm} install --save-dev --package-lock-only --no-package-lock sveltekit-adapter-iis`;

									const config = `import IISAdapter from 'sveltekit-adapter-iis';
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

									await fs.writeFile(path.join(dir, 'svelte.config.js'), config);
								},
								startMessage: 'Setting up sveltekit-adapter-iis',
								endMessage: 'Setup sveltekit-adapter-iis',
							},
						},
					],
					initialValue: 'Auto',
				},
				{
					kind: 'multiselect',
					message: 'What features should be included?',
					options: [
						{
							name: 'Threlte',
							select: {
								run: async ({ dir }) => {
									await execa({
										cwd: dir,
									})`${pm} install --save --package-lock-only --no-package-lock @threlte/core three @types/three`;

									return [
										{
											message:
												'Do you want to install any other @threlte packages?',
											kind: 'multiselect',
											options: [
												'@threlte/extras',
												'@threlte/gltf',
												'@threlte/rapier',
												'@threlte/theatre',
												'@threlte/xr',
												'@threlte/flex',
											].map((pack) => ({
												name: pack,
												select: {
													run: async ({ dir }) => {
														await execa({
															cwd: dir,
														})`${pm} install --save --package-lock-only --no-package-lock ${pack}`;
													},
													startMessage: `Installing ${pack}`,
													endMessage: `Installed ${pack}`,
												},
											})),
										},
									];
								},
								startMessage: 'Installing @threlte/core, three, and @types/three',
								endMessage: 'Installed Threlte',
							},
						},
					],
				},
				{
					kind: 'confirm',
					message: 'Install dependencies?',
					yes: {
						run: async ({ dir }) => {
							await execa({
								cwd: dir,
							})`${pm} install`;
						},
						startMessage: 'Installing dependencies',
						endMessage: 'Installed dependencies',
					},
					no: {
						run: async ({}) => {
							// do nothing
						},
					},
				},
			],
			templateFiles: [
				{
					path: 'package.json',
					replacements: [
						{
							match: '"sveltekit-template"',
							replace: ({ projectName }) => `"${projectName}"`,
						},
					],
				},
			],
			copyCompleted: async ({ dir, projectName }) => {
				const file = path.join(dir, 'README.md');

				const content = `# ${projectName}
This project was created for you with the help of [ez-template](https://github.com/ieedan/ez-template-js)`;

				await fs.writeFile(file, content);
			},
		},
	];

	// create template
	await template.create({ appName: '@ieedan/templates', templates });
};

/** Allows you to remove dependency without creating node_modules */
const removeDependency = async (packageName: string, { pm, dir }: { pm: PM; dir: string }) => {
	const file = path.join(dir, 'package.json');

	const pkg = JSON.parse((await fs.readFile(file)).toString());

	pkg.devDependencies[packageName] = undefined;
	pkg.dependencies[packageName] = undefined;

	const newFile = JSON.stringify(pkg, null, 2);

	await fs.writeFile(file, newFile);
};

main();
