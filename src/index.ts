import fs from 'fs-extra';
import path from 'node:path';
import { create, Template, util } from 'template-factory';
import color from 'chalk';
import {
	BIN_FILE,
	iisSvelteConfig,
	PUBLISH_WORKFLOW,
	SVELTE_CONFIG_FILE_VERCEL,
	SVELTEKIT_GIT_IGNORE,
	SVELTEKIT_NPMRC,
	TS_CONFIG_FILE,
	UNBUILD_CONFIG_FILE,
	VERCEL_ANALYTICS_HOOKS_CLIENT_TS,
	VERCEL_SPEED_INSIGHTS_HOOKS_CLIENT_TS,
} from './template-files';
import { execa } from 'execa';
import { addDependencies, removeDependency } from './util';

const main = async () => {
	const pm = 'npm';

	// define the project templates inside of `/templates` here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: util.relative('templates/sveltekit', import.meta.url),
			excludeFiles: ['README.md', 'package-lock.json', 'node_modules'],
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

									await addDependencies(['@sveltejs/adapter-vercel'], 'dev', {
										pm,
										dir,
									});

									const config = SVELTE_CONFIG_FILE_VERCEL;

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
															await addDependencies(
																['@vercel/analytics'],
																'dev',
																{ pm, dir }
															);

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const code =
																	VERCEL_ANALYTICS_HOOKS_CLIENT_TS;

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
															await addDependencies(
																['@vercel/speed-insights'],
																'dev',
																{ pm, dir }
															);

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const code =
																	VERCEL_SPEED_INSIGHTS_HOOKS_CLIENT_TS;

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

									await addDependencies(['sveltekit-adapter-iis'], 'dev', {
										pm,
										dir,
									});

									const config = iisSvelteConfig(projectName);

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
					kind: 'confirm',
					message: 'Use sveltekit-superforms?',
					initialValue: true,
					yes: {
						run: async ({ dir }) => {
							await addDependencies(['zod', 'sveltekit-superforms'], 'regular', {
								pm,
								dir,
							});

							// in the future we could add some starter files down here
						},
						startMessage: 'Setting up sveltekit-superforms',
						endMessage: 'Setup sveltekit-superforms',
					},
				},
				{
					kind: 'multiselect',
					message: 'What features should be included?',
					options: [
						{
							name: 'Threlte',
							select: {
								run: async ({ dir }) => {
									await addDependencies(
										['@threlte/core', 'three', '@types/three'],
										'regular',
										{ pm, dir }
									);

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
														await addDependencies([pack], 'regular', {
															pm,
															dir,
														});
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
				// setup files
				const files = [
					{
						name: 'README.md',
						content: `# ${projectName}
This project was created for you with the help of [template-factory](https://github.com/ieedan/template-factory-js)`,
					},
					// these are not uploaded to NPM for some reason
					{
						name: '.gitignore',
						content: SVELTEKIT_GIT_IGNORE,
					},
					{
						name: '.npmrc',
						content: SVELTEKIT_NPMRC,
					},
				];

				// generate files
				for (const file of files) {
					await fs.writeFile(path.join(dir, file.name), file.content);
				}
			},
		},
		{
			name: 'template-factory Project',
			flag: 'template-factory',
			path: util.relative('templates/template-factory', import.meta.url),
			excludeFiles: ['package-lock.json', 'README.md', 'node_modules'],
			prompts: [
				{
					kind: 'confirm',
					message: 'Would you like to use TypeScript?',
					initialValue: true,
					yes: {
						run: async ({ dir }) => {
							await addDependencies(
								['typescript', 'unbuild', '@types/fs-extra'],
								'dev',
								{ pm, dir }
							);

							await fs.writeFile(
								path.join(dir, 'build.config.ts'),
								UNBUILD_CONFIG_FILE
							);

							const packagePath = path.join(dir, 'package.json');

							const pkg = JSON.parse((await fs.readFile(packagePath)).toString());

							pkg.scripts.start = 'unbuild && node bin.mjs';
							pkg.scripts.build = 'unbuild';

							await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));

							await fs.writeFile(path.join(dir, 'tsconfig.json'), TS_CONFIG_FILE);

							const gitignore = `node_modules

index.d.mts
index.d.ts
index.mjs
prompts.d.mts
prompts.d.ts
prompts.mjs
template-files.d.mts
template-files.d.ts
template-files.mjs
util.d.mts
util.d.ts
util.mjs`;

							await fs.writeFile(path.join(dir, '.gitignore'), gitignore);

							const binFile = `#!/usr/bin/env node
import('./index.mjs');`;

							await fs.writeFile(path.join(dir, 'bin.mjs'), binFile);

							await fs.createFile(path.join(dir, './src/index.ts'));

							await fs.writeFile(path.join(dir, './src/index.ts'), BIN_FILE);
						},
						startMessage: 'Setting up for TypeScript',
						endMessage: 'Set up for TypeScript',
					},
					no: {
						run: async ({ dir }) => {
							const packagePath = path.join(dir, 'package.json');

							const pkg = JSON.parse((await fs.readFile(packagePath)).toString());

							pkg.scripts.start = 'node bin.mjs';

							await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));

							const gitignore = `node_modules`;

							await fs.writeFile(path.join(dir, '.gitignore'), gitignore);

							const binFile = `#!/usr/bin/env node\r\n` + BIN_FILE;

							await fs.writeFile(path.join(dir, 'bin.mjs'), binFile);
						},
						startMessage: 'Setting up for JavaScript',
						endMessage: 'Set up for JavaScript',
					},
				},
				{
					kind: 'confirm',
					message: 'Install prettier?',
					yes: {
						run: async ({ dir }) => {
							await addDependencies(['prettier'], 'dev', { pm, dir });

							const rc = `{
	"useTabs": true,
	"tabWidth": 4,
	"singleQuote": true,
	"trailingComma": "es5",
	"printWidth": 100
}
`;

							await fs.writeFile(path.join(dir, '.prettierrc'), rc);

							await fs.writeFile(path.join(dir, '.prettierignore'), 'templates');

							const packagePath = path.join(dir, 'package.json');

							const pkg = JSON.parse((await fs.readFile(packagePath)).toString());

							pkg.scripts.format = 'npx prettier . --write';

							await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
						},
						startMessage: 'Setting up prettier',
						endMessage: 'Set up prettier',
					},
				},
				{
					kind: "confirm",
					message: "Setup automatic publish workflow?",
					yes: {
						run: async ({ dir }) => {
							const filePath = path.join(dir, '.github/workflows/publish.yml');

							await fs.createFile(filePath);

							await fs.writeFile(filePath, PUBLISH_WORKFLOW);
						},
						startMessage: "Setting up publish workflow",
						endMessage: "Set up publish workflow"
					}
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
				},
			],
			templateFiles: [
				{
					path: 'package.json',
					replacements: [
						{
							match: 'template-placeholder-name',
							replace: ({ projectName }) => `${projectName}`,
						},
					],
				},
			],
		},
	];

	// get version from package.json
	const { version, name } = JSON.parse(
		fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8')
	);

	// create template
	await create({
		appName: name,
		templates,
		version,
		customization: {
			intro: async ({ appName, version }) => {
				const name = color.bgHex('#ff66cc').black(` ${appName} `);
				const ver = color.gray(` v${version} `);
				return name + ver;
			},
			outro: async ({}) => {
				return color.green('All done!');
			},
		},
	});
};

main();
