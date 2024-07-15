import fs from 'fs-extra';
import path from 'node:path';
import { create, Template, util } from 'template-factory';
import color from 'chalk';
import { execa } from 'execa';
import { addDependencies, removeDependency } from './util';

const main = async () => {
	const pm = 'npm';

	// define the project templates inside of `/templates` here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: util.relative('../templates/sveltekit', import.meta.url),
			excludeFiles: ['README.md', 'package-lock.json', 'node_modules', 'template-files'],
			prompts: [
				{
					kind: 'select',
					message: 'What is your deployment environment?',
					options: [
						{
							name: 'Auto',
							select: {
								run: async () => {
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
									await removeDependency('@sveltejs/adapter-auto', { dir });

									await addDependencies(['@sveltejs/adapter-vercel'], 'dev', {
										pm,
										dir,
									});

									const configPath = util.relative(
										'../templates/sveltekit/template-files/vercel/svelte.config.js',
										import.meta.url
									);

									await fs.copy(configPath, path.join(dir, 'svelte.config.js'));

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
																const codePath = util.relative(
																	'../templates/sveltekit/template-files/vercel/hooks.client.ts/+analytics/hooks.client.ts',
																	import.meta.url
																);

																await fs.copy(codePath, hooksPath);
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
																const codePath = util.relative(
																	'../templates/sveltekit/template-files/vercel/hooks.client.ts/+speed-insights/hooks.client.ts',
																	import.meta.url
																);

																await fs.copy(codePath, hooksPath);
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
									await removeDependency('@sveltejs/adapter-auto', { dir });

									await addDependencies(['sveltekit-adapter-iis'], 'dev', {
										pm,
										dir,
									});

									const configPath = util.relative(
										'../templates/sveltekit/template-files/iis/svelte.config.js',
										import.meta.url
									);

									let content = (await fs.readFile(configPath)).toString();

									content = content.replace('${projectName}', projectName);

									await fs.writeFile(path.join(dir, 'svelte.config.js'), content);
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
							name: 'Auth.js',
							select: {
								run: async ({ dir }) => {
									await addDependencies(['@auth/sveltekit'], 'regular', {
										pm,
										dir,
									});

									const authPath = util.relative(
										'../templates/sveltekit/template-files/Auth.js/auth.ts',
										import.meta.url
									);

									await fs.copy(authPath, path.join(dir, 'src/auth.ts'));

									const hooksPath = util.relative(
										'../templates/sveltekit/template-files/Auth.js/hooks.server.ts',
										import.meta.url
									);

									await fs.copy(hooksPath, path.join(dir, 'src/hooks.server.ts'));

									const signinPath = util.relative(
										'../templates/sveltekit/template-files/Auth.js/signin/+page.server.ts',
										import.meta.url
									);

									await fs.createFile(
										path.join(dir, 'src/routes/signin/+page.server.ts')
									);

									await fs.copy(
										signinPath,
										path.join(dir, 'src/routes/signin/+page.server.ts')
									);

									const signoutPath = util.relative(
										'../templates/sveltekit/template-files/Auth.js/signout/+page.server.ts',
										import.meta.url
									);

									await fs.createFile(
										path.join(dir, 'src/routes/signout/+page.server.ts')
									);

									await fs.copy(
										signoutPath,
										path.join(dir, 'src/routes/signout/+page.server.ts')
									);

									await fs.copy(
										util.relative(
											'../templates/sveltekit/template-files/Auth.js/+page.svelte',
											import.meta.url
										),
										path.join(dir, 'src/routes/+page.svelte')
									);

									await fs.copy(
										util.relative(
											'../templates/sveltekit/template-files/Auth.js/+layout.server.ts',
											import.meta.url
										),
										path.join(dir, 'src/routes/+layout.server.ts')
									);

									return [
										{
											kind: 'confirm',
											message: "Generate auth secret and add it to '.env'?",
											yes: {
												run: async ({ dir }) => {
													await execa({ cwd: dir })`npx auth secret`;
												},
												startMessage: "Setting up '.env' file for Auth.js",
												endMessage: "Setup '.env' file for Auth.js",
											},
											no: {
												run: async ({ dir }) => {
													const envFile =
														'# Auth.js\r\n# Generate a secret with `npx auth secret`\r\nAUTH_SECRET=';

													await fs.writeFile(
														path.join(dir, '.env'),
														envFile
													);
												},
												startMessage: "Setting up '.env' file for Auth.js",
												endMessage: "Setup '.env' file for Auth.js",
											},
										},
										{
											kind: 'multiselect',
											message: 'Add OAuth providers?',
											options: [
												{
													name: 'GitHub',
													select: {
														run: async ({ dir }) => {
															const envPath = path.join(dir, '.env');

															let envFile = (
																await fs.readFile(envPath)
															).toString();

															envFile =
																envFile +
																`\r\n# Setup GitHub app here https://github.com/settings/applications/new\r\nAUTH_GITHUB_ID\r\nAUTH_GITHUB_SECRET`;

															await fs.writeFile(envPath, envFile);

															const authPath = path.join(
																dir,
																'src/auth.ts'
															);

															let authFile = (
																await fs.readFile(authPath)
															).toString();

															authFile = authFile.replace(
																`import { SvelteKitAuth } from '@auth/sveltekit';`,
																`import { SvelteKitAuth } from '@auth/sveltekit';\r\nimport GitHub from "@auth/sveltekit/providers/github"`
															);

															await fs.writeFile(authPath, authFile);
														},
														startMessage:
															'Setting up @auth/sveltekit/providers/github',
														endMessage:
															'Set up @auth/sveltekit/providers/github',
													},
												},
												{
													name: 'Google',
													select: {
														run: async ({ dir }) => {
															const envPath = path.join(dir, '.env');

															let envFile = (
																await fs.readFile(envPath)
															).toString();

															envFile =
																envFile +
																`\r\n# Setup Google app here https://console.cloud.google.com/apis/credentials\r\nAUTH_GOOGLE_ID\r\nAUTH_GOOGLE_SECRET`;

															await fs.writeFile(envPath, envFile);

															const authPath = path.join(
																dir,
																'src/auth.ts'
															);

															let authFile = (
																await fs.readFile(authPath)
															).toString();

															authFile = authFile.replace(
																`import { SvelteKitAuth } from '@auth/sveltekit';`,
																`import { SvelteKitAuth } from '@auth/sveltekit';\r\nimport Google from "@auth/sveltekit/providers/google"`
															);

															await fs.writeFile(authPath, authFile);
														},
														startMessage:
															'Setting up @auth/sveltekit/providers/google',
														endMessage:
															'Set up @auth/sveltekit/providers/google',
													},
												},
												{
													name: 'Apple',
													select: {
														run: async ({ dir }) => {
															const envPath = path.join(dir, '.env');

															let envFile = (
																await fs.readFile(envPath)
															).toString();

															envFile =
																envFile +
																`\r\n# Setup Apple app here https://authjs.dev/getting-started/providers/apple\r\nAUTH_APPLE_ID\r\nAUTH_APPLE_SECRET`;

															await fs.writeFile(envPath, envFile);

															const authPath = path.join(
																dir,
																'src/auth.ts'
															);

															let authFile = (
																await fs.readFile(authPath)
															).toString();

															authFile = authFile.replace(
																`import { SvelteKitAuth } from '@auth/sveltekit';`,
																`import { Apple } from '@auth/sveltekit';\r\nimport Google from "@auth/sveltekit/providers/apple"`
															);

															await fs.writeFile(authPath, authFile);
														},
														startMessage:
															'Setting up @auth/sveltekit/providers/google',
														endMessage:
															'Set up @auth/sveltekit/providers/google',
													},
												},
											],
											result: {
												run: async (result, { dir }) => {
													if (!Array.isArray(result)) return;

													const authPath = path.join(dir, 'src/auth.ts');

													let authFile = (
														await fs.readFile(authPath)
													).toString();

													authFile = authFile.replace(
														`providers: []`,
														`providers: [${result.join(',')}]`
													);

													await fs.writeFile(authPath, authFile);
												},
												startMessage: 'Setting up src/auth.ts',
												endMessage: 'Set up src/auth.ts',
											},
										},
									];
								},
								startMessage: 'Installing @auth/sveltekit',
								endMessage: 'Installed @auth/sveltekit',
							},
						},
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
						content: (
							await fs.readFile(
								util.relative(
									'../templates/sveltekit/template-files/gitignore.txt',
									import.meta.url
								)
							)
						).toString(),
					},
					{
						name: '.npmrc',
						content: (
							await fs.readFile(
								util.relative(
									'../templates/sveltekit/template-files/npmrc.txt',
									import.meta.url
								)
							)
						).toString(),
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
			path: util.relative('../templates/template-factory', import.meta.url),
			excludeFiles: ['package-lock.json', 'README.md', 'node_modules', 'template-files'],
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

							const buildConfigPath = util.relative(
								'../templates/template-factory/template-files/build.config.ts',
								import.meta.url
							);

							await fs.copy(buildConfigPath, path.join(dir, 'build.config.ts'));

							const packagePath = path.join(dir, 'package.json');

							const pkg = JSON.parse((await fs.readFile(packagePath)).toString());

							pkg.scripts.start = 'unbuild && node bin.mjs';
							pkg.scripts.build = 'unbuild';

							await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));

							const tsConfigPath = util.relative(
								'../templates/template-factory/template-files/tsconfig.json',
								import.meta.url
							);

							await fs.copy(tsConfigPath, path.join(dir, 'tsconfig.json'));

							const gitignorePath = util.relative(
								'../templates/template-factory/template-files/gitignore.txt',
								import.meta.url
							);

							const gitignore = await fs.readFile(gitignorePath);

							await fs.writeFile(path.join(dir, '.gitignore'), gitignore);

							const binPath = util.relative(
								'../templates/template-factory/template-files/index.js',
								import.meta.url
							);

							await fs.mkdir(path.join(dir, 'src'));

							await fs.copy(binPath, path.join(dir, './src/index.ts'));

							const binFile = `#!/usr/bin/env node\r\nimport('./dist/index.mjs');`;

							await fs.writeFile(path.join(dir, 'bin.mjs'), binFile);
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

							const indexPath = util.relative(
								'../templates/template-factory/template-files/index.js',
								import.meta.url
							);

							await fs.mkdir(path.join(dir, 'src'));

							await fs.copy(indexPath, path.join(dir, 'src/index.js'));

							const binFile = `#!/usr/bin/env node\r\nimport('./src/index.js');`;

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

							const prettierrcPath = util.relative(
								'../templates/template-factory/template-files/.prettierrc',
								import.meta.url
							);

							await fs.copy(prettierrcPath, path.join(dir, '.prettierrc'));

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
					kind: 'confirm',
					message: 'Setup automatic publish workflow?',
					yes: {
						run: async ({ dir }) => {
							const filePath = path.join(dir, '.github/workflows/publish.yml');

							await fs.createFile(filePath);

							const publishPath = util.relative(
								'../templates/template-factory/template-files/publish.yml',
								import.meta.url
							);

							await fs.copy(publishPath, filePath);
						},
						startMessage: 'Setting up publish workflow',
						endMessage: 'Set up publish workflow',
					},
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
		fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
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
			outro: async () => {
				return color.green('All done!');
			},
		},
	});
};

main();
