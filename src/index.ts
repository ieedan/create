import fs from 'fs-extra';
import path from 'node:path';
import { create, CreateOptions, Template } from 'template-factory';
import * as util from 'template-factory/util';
import { installDependencies } from 'template-factory/plugins/js/prompts';
import { addDependencies, removeDependencies } from 'template-factory/plugins/js/util';
import color from 'chalk';
import { execa as $ } from 'execa';
import { SveltekitTemplateState } from './types';
import { packages } from './packages';
import { addScript } from './util';

const main = async () => {
	const pm = 'npm';

	// define the project templates inside of `/templates` here
	const templates = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: util.relative('../templates/sveltekit', import.meta.url),
			excludeFiles: ['package-lock.json', 'node_modules', 'template-files'],
			state: {
				installedDependencies: false,
				addedProviders: [],
				shadcnSvelteConfig: { style: 'default' },
			},
			prompts: [
				{
					kind: 'select',
					message: `${color.bgHex('#ff5500').black(' shadcn-svelte ')} Which style would you like to use?`,
					initialValue: 'Default',
					options: [
						{
							name: 'Default',
						},
						{
							name: 'New York',
						},
					],
					result: {
						run: async (result, { state }) => {
							if (result == 'Default') {
								state.shadcnSvelteConfig.style = 'default';
							} else if (result == 'New York') {
								state.shadcnSvelteConfig.style = 'new-york';
							}
						},
					},
				},
				{
					kind: 'select',
					message: `${color.bgHex('#ff5500').black(' shadcn-svelte ')} Which base color would you like to use?`,
					initialValue: 'Zinc',
					options: [
						{
							name: 'Slate',
						},
						{
							name: 'Gray',
						},
						{
							name: 'Zinc',
						},
						{
							name: 'Neutral',
						},
						{
							name: 'Stone',
						},
					],
					result: {
						run: async (result, { state, dir, error }) => {
							await $({
								cwd: dir,
							})`npx shadcn-svelte@latest init --no-deps --style ${state.shadcnSvelteConfig.style} --base-color ${result.toLowerCase()} --css src/app.css --tailwind-config tailwind.config.ts --components-alias $lib/components --utils-alias $lib/utils`.catch(
								(err) => error(err)
							);

							await addDependencies(
								dir,
								packages['clsx'],
								packages['tailwind-merge'],
								packages['tailwind-variants']
							);

							if (state.shadcnSvelteConfig.style == 'new-york') {
								await addDependencies(dir, packages['svelte-radix']);

								await fs.copy(
									util.relative(
										'../templates/sveltekit/template-files/styles/new-york/light-switch',
										import.meta.url
									),
									path.join(dir, 'src/lib/components/ui/light-switch')
								);
							} else {
								await addDependencies(dir, packages['lucide-svelte']);
								await fs.copy(
									util.relative(
										'../templates/sveltekit/template-files/styles/default/light-switch',
										import.meta.url
									),
									path.join(dir, 'src/lib/components/ui/light-switch')
								);
							}

							// Add font family to tailwind.config.ts
							const tailwindConfigPath = path.join(dir, 'tailwind.config.ts');
							let tailwindConfigContent = (
								await fs.readFile(tailwindConfigPath)
							).toString();

							tailwindConfigContent = tailwindConfigContent.replace(
								`fontFamily: {
				sans: [...fontFamily.sans]
			}`,
								`fontFamily: {
				serif: ['Geist Mono', 'Monospace'],
				sans: ['Geist Sans', 'sans-serif']
			}`
							);

							await fs.writeFile(tailwindConfigPath, tailwindConfigContent);
						},
						startMessage: `Configuring ${color.bold('shadcn-svelte')}`,
						endMessage: `Configured ${color.bold('shadcn-svelte')}`,
					},
				},
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
									await removeDependencies(dir, '@sveltejs/adapter-auto');

									await addDependencies(dir, {
										name: '@sveltejs/adapter-vercel',
										scope: 'regular',
										version: '^5.4.1',
									});

									const configPath = util.relative(
										'../templates/sveltekit/template-files/deployment/vercel/svelte.config.js',
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
																dir,
																packages['@vercel/analytics']
															);

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const codePath = util.relative(
																	'../templates/sveltekit/template-files/deployment/vercel/hooks.client.ts/+analytics/hooks.client.ts',
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
																dir,
																packages['@vercel/speed-insights']
															);

															const hooksPath = path.join(
																dir,
																'/src/hooks.client.ts'
															);

															if (!(await fs.exists(hooksPath))) {
																const codePath = util.relative(
																	'../templates/sveltekit/template-files/deployment/vercel/hooks.client.ts/+speed-insights/hooks.client.ts',
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
									await removeDependencies(dir, '@sveltejs/adapter-auto');

									await addDependencies(dir, packages['sveltekit-adapter-iis']);

									const configPath = util.relative(
										'../templates/sveltekit/template-files/deployment/iis/svelte.config.js',
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
					kind: 'multiselect',
					message: 'Would you like to setup authentication?',
					required: false,
					options: [
						{
							name: 'Auth.js',
							select: {
								run: async ({ dir, projectName, error }) => {
									await addDependencies(dir, packages['@auth/sveltekit']);

									// create auth directory

									await fs
										.mkdir(path.join(dir, 'src/routes/dashboard'), {
											recursive: true,
										})
										.catch((err) => error(err));

									await fs.copy(
										util.relative(
											'../templates/sveltekit/template-files/auth/Auth.js/routes/dashboard/+page.svelte',
											import.meta.url
										),
										path.join(dir, 'src/routes/dashboard/+page.svelte')
									);

									await fs
										.mkdir(path.join(dir, 'src/lib/auth'), {
											recursive: true,
										})
										.catch((err) => error(err));

									const indexPath = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/auth/index.ts',
										import.meta.url
									);

									await fs
										.copy(indexPath, path.join(dir, 'src/lib/auth/index.ts'))
										.catch((err) => error(err));

									const providersPath = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/auth/providers.ts',
										import.meta.url
									);

									await fs
										.copy(
											providersPath,
											path.join(dir, 'src/lib/auth/providers.ts')
										)
										.catch((err) => error(err));

									const hooksPath = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/hooks.server.ts',
										import.meta.url
									);

									await fs.copy(hooksPath, path.join(dir, 'src/hooks.server.ts'));

									const signinPath = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/routes/signin',
										import.meta.url
									);

									await fs
										.mkdir(path.join(dir, 'src/routes/signin'))
										.catch((err) => error(err));

									await fs
										.copy(signinPath, path.join(dir, 'src/routes/signin'))
										.catch((err) => error(err));

									const signInSveltePath = path.join(
										dir,
										'src/routes/signin/+page.svelte'
									);

									let signInContent = (
										await fs.readFile(signInSveltePath)
									).toString();

									signInContent = signInContent.replace(
										`{{ PROJECT_NAME }}`,
										projectName
									);

									await fs
										.writeFile(signInSveltePath, signInContent)
										.catch((err) => error(err));

									const signoutPath = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/routes/signout/+page.server.ts',
										import.meta.url
									);

									await fs
										.createFile(
											path.join(dir, 'src/routes/signout/+page.server.ts')
										)
										.catch((err) => error(err));

									await fs
										.copy(
											signoutPath,
											path.join(dir, 'src/routes/signout/+page.server.ts')
										)
										.catch((err) => error(err));

									await fs
										.copy(
											util.relative(
												'../templates/sveltekit/template-files/auth/Auth.js/routes/+page.svelte',
												import.meta.url
											),
											path.join(dir, 'src/routes/+page.svelte')
										)
										.catch((err) => error(err));

									await fs
										.copy(
											util.relative(
												'../templates/sveltekit/template-files/auth/Auth.js/routes/+layout.server.ts',
												import.meta.url
											),
											path.join(dir, 'src/routes/+layout.server.ts')
										)
										.catch((err) => error(err));

									const templateAssetIconsDir = util.relative(
										'../templates/sveltekit/template-files/auth/Auth.js/assets/icons',
										import.meta.url
									);

									const componentIconsDir = path.join(
										dir,
										'src/lib/components/icons'
									);

									if (!(await fs.exists(componentIconsDir))) {
										await fs
											.mkdir(componentIconsDir, {
												recursive: true,
											})
											.catch((err) => error(err));
									}

									const assetIconsDir = path.join(dir, 'src/lib/assets/icons');

									if (!(await fs.exists(assetIconsDir))) {
										await fs
											.mkdir(assetIconsDir, {
												recursive: true,
											})
											.catch((err) => error(err));
									}

									return [
										{
											kind: 'confirm',
											message: "Generate auth secret and add it to '.env'?",
											yes: {
												run: async ({ dir }) => {
													await $({
														cwd: dir,
													})`npx auth secret`;
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
											options: (
												[
													{
														name: 'Apple',
														iconVariants: true,
														docs: 'https://developer.apple.com/sign-in-with-apple/get-started/',
													},
													{
														name: 'Discord',
														iconVariants: false,
														docs: 'https://discord.com/developers/applications',
													},
													{
														name: 'Facebook',
														iconVariants: false,
														docs: 'https://developers.facebook.com/apps/',
													},
													{
														name: 'GitHub',
														iconVariants: true,
														docs: 'https://github.com/settings/applications/new',
													},
													{
														name: 'GitLab',
														iconVariants: false,
														docs: 'https://docs.gitlab.com/ee/api/oauth2.html',
													},
													{
														name: 'Google',
														iconVariants: false,
														docs: 'https://console.cloud.google.com/apis/credentials',
													},
													{
														name: 'Reddit',
														iconVariants: false,
														docs: 'https://www.reddit.com/prefs/apps/',
													},
													{
														name: 'Slack',
														iconVariants: false,
														docs: 'https://api.slack.com/apps',
													},
												] satisfies {
													name: string;
													iconVariants: boolean;
													docs: string;
												}[]
											).map((provider) => ({
												name: provider.name,
												select: {
													run: async ({ dir }) => {
														const envPath = path.join(dir, '.env');

														let envFile = (
															await fs.readFile(envPath)
														).toString();

														envFile =
															envFile +
															`\r\n# Setup ${provider.name} app here ${provider.docs}` +
															`\r\nAUTH_${provider.name.toUpperCase()}_ID` +
															`\r\nAUTH_${provider.name.toUpperCase()}_SECRET`;

														await fs
															.writeFile(envPath, envFile)
															.catch((err) => error(err));

														const providersPath = path.join(
															dir,
															'src/lib/auth/providers.ts'
														);

														let providersFile = (
															await fs.readFile(providersPath)
														).toString();

														providersFile = providersFile.replace(
															`import type { Provider } from '@auth/sveltekit/providers';`,
															`import type { Provider } from '@auth/sveltekit/providers';` +
																`\r\nimport ${provider.name} from '@auth/sveltekit/providers/${provider.name.toLowerCase()}';`
														);

														await fs
															.writeFile(providersPath, providersFile)
															.catch((err) => error(err));

														let iconComponent = '';

														if (provider.iconVariants) {
															await fs
																.copy(
																	path.join(
																		templateAssetIconsDir,
																		`${provider.name.toLowerCase()}-dark.svg`
																	),
																	path.join(
																		assetIconsDir,
																		`${provider.name.toLowerCase()}-dark.svg`
																	)
																)
																.catch((err) => error(err));

															await fs
																.copy(
																	path.join(
																		templateAssetIconsDir,
																		`${provider.name.toLowerCase()}-light.svg`
																	),
																	path.join(
																		assetIconsDir,
																		`${provider.name.toLowerCase()}-light.svg`
																	)
																)
																.catch((err) => error(err));

															iconComponent = `<script lang="ts">
			import dark from "$lib/assets/icons/${provider.name.toLowerCase()}-dark.svg"
			import light from "$lib/assets/icons/${provider.name.toLowerCase()}-light.svg"
			import { mode } from "mode-watcher"
		</script>
		
		{#if $mode == "light"}
			<img src={light} alt="${provider.name} logo" {...$$restProps}>
		{:else}
			<img src={dark} alt="${provider.name} logo" {...$$restProps}>
		{/if}
		`;
														} else {
															await fs
																.copy(
																	path.join(
																		templateAssetIconsDir,
																		`${provider.name.toLowerCase()}.svg`
																	),
																	path.join(
																		assetIconsDir,
																		`${provider.name.toLowerCase()}.svg`
																	)
																)
																.catch((err) => error(err));

															iconComponent = `<script lang="ts">
																		import logo from "$lib/assets/icons/${provider.name.toLowerCase()}.svg"
																	</script>
																	
																	<img src={logo} alt="${provider.name} logo" {...$$restProps}>
																	`;
														}

														await fs.writeFile(
															path.join(
																componentIconsDir,
																`${provider.name.toLowerCase()}.svelte`
															),
															iconComponent
														);
													},
													startMessage: `Setting up @auth/sveltekit/providers/${provider.name.toLowerCase()}`,
													endMessage: `Set up @auth/sveltekit/providers/${provider.name.toLowerCase()}`,
												},
											})),
											result: {
												run: async (result, { dir, state, error }) => {
													if (!Array.isArray(result)) return;

													const providers = result as string[];

													const providersPath = path.join(
														dir,
														'src/lib/auth/providers.ts'
													);

													let providersFile = (
														await fs.readFile(providersPath)
													).toString();

													providersFile = providersFile.replace(
														`: Provider[] = [];`,
														`: Provider[] = [${providers.join(', ')}];`
													);

													await fs
														.writeFile(providersPath, providersFile)
														.catch((err) => error(err));

													state.addedProviders = providers;

													let signInContent = (
														await fs.readFile(signInSveltePath)
													).toString();

													signInContent = signInContent.replace(
														'// put icon imports here',
														`import { ${result.join(', ')} } from '$lib/components/icons';`
													);

													const mappedProviders = result.map(
														(provider, index) => {
															if (index == 0) {
																return `{#if provider.name == '${provider}'}
								<${provider} class="size-5"/>
							${index == result.length - 1 ? '{/if}' : ''}`;
															}

															if (index == result.length - 1) {
																return `\t\t\t\t\t{:else if provider.name == '${provider}'}
								<${provider} class="size-5"/>
							{/if}`;
															}

															return `\t\t\t\t\t{:else if provider.name == '${provider}'}
								<${provider} class="size-5"/>`;
														}
													);

													signInContent = signInContent.replace(
														'Continue with {provider.name}',
														mappedProviders.join('\r\n') +
															'\r\n\t\t\t\t\tContinue with {provider.name}'
													);

													await fs.writeFile(
														signInSveltePath,
														signInContent
													);

													const componentIconsExportPath = path.join(
														componentIconsDir,
														'index.ts'
													);

													const mappedImports = providers.map(
														(provider) => {
															return `import ${provider} from './${provider.toLowerCase()}.svelte';`;
														}
													);

													const exportFile =
														mappedImports.join('\r\n') +
														`\r\n\r\nexport { ${result.join(', ')} };`;

													await fs
														.writeFile(
															componentIconsExportPath,
															exportFile
														)
														.catch((err) => error(err));
												},
												startMessage: 'Setting up sign in page',
												endMessage: 'Set up sign in page',
											},
										},
									];
								},
								startMessage: 'Installing @auth/sveltekit',
								endMessage: 'Installed @auth/sveltekit',
							},
						},
					],
				},
				{
					kind: 'multiselect',
					message: 'Would you like to setup a database?',
					required: false,
					options: [
						{
							name: 'Turso',
							hint: 'Free, 500 DBs, 9GB total storage, 1B row reads',
							select: {
								run: async ({ dir, state }) => {
									state.usingDatabase = 'turso';

									const envPath = path.join(dir, '.env');

									let existed = true;

									if (!(await fs.exists(envPath))) {
										existed = false;
										await fs.createFile(envPath);
									}

									let envContent = (await fs.readFile(envPath)).toString();

									envContent =
										envContent +
										`${existed ? `\r\n` : ''}TURSO_DATABASE_URL=\r\nTURSO_AUTH_TOKEN=`;

									await fs.writeFile(envPath, envContent);

									return [
										{
											kind: 'confirm',
											message: 'Setup database URL?',
											yes: {
												run: async () => {
													return [
														{
															kind: 'text',
															message: 'What is your database url?',
															placeholder: '(right click to paste)',
															validate: (dbUrl) => {
																// libsql://testing-ieedan.turso.io
																if (dbUrl == '')
																	return 'Please enter a database URL.';

																if (!dbUrl.startsWith('libsql://'))
																	return 'Please enter a valid database URL';

																if (!dbUrl.endsWith('turso.io'))
																	return 'The database url must have a turso domain.';
															},
															result: {
																run: async (result) => {
																	let content = (
																		await fs.readFile(envPath)
																	).toString();

																	content = content.replace(
																		'TURSO_DATABASE_URL=',
																		`TURSO_DATABASE_URL="${result}"`
																	);

																	await fs.writeFile(
																		envPath,
																		content
																	);
																},
															},
														},
													];
												},
											},
										},
										{
											kind: 'confirm',
											message: 'Setup API Key?',
											yes: {
												run: async () => {
													return [
														{
															kind: 'password',
															message: `Enter your API key`,
															validate: (key) => {
																if (key == '')
																	return 'Please enter your API key.';
															},
															result: {
																run: async (result) => {
																	let envContent = (
																		await fs.readFile(envPath)
																	).toString();

																	envContent = envContent.replace(
																		'TURSO_AUTH_TOKEN=',
																		`TURSO_AUTH_TOKEN="${result}"`
																	);

																	await fs.writeFile(
																		envPath,
																		envContent
																	);
																},
															},
														},
													];
												},
											},
										},
										{
											kind: 'select',
											message: 'What ORM would you like to use?',
											initialValue: 'Drizzle',
											options: [
												{
													name: 'Drizzle',
													hint: 'https://orm.drizzle.team/',
													select: {
														run: async ({ error }) => {
															await addDependencies(
																dir,
																packages['drizzle-orm'],
																packages['@libsql/client'],
																packages['drizzle-kit'],
																packages['dotenv']
															);

															await fs
																.copy(
																	util.relative(
																		'../templates/sveltekit/template-files/db/turso/drizzle/db/db.ts',
																		import.meta.url
																	),
																	path.join(
																		dir,
																		'src/lib/db/db.ts'
																	)
																)
																.catch((err) => error(err));

															await fs
																.copy(
																	util.relative(
																		'../templates/sveltekit/template-files/db/turso/drizzle/db/schema.ts',
																		import.meta.url
																	),
																	path.join(
																		dir,
																		'src/lib/db/schema.ts'
																	)
																)
																.catch((err) => error(err));

															await fs
																.copy(
																	util.relative(
																		'../templates/sveltekit/template-files/db/turso/drizzle/drizzle.config.ts',
																		import.meta.url
																	),
																	path.join(
																		dir,
																		'drizzle.config.ts'
																	)
																)
																.catch((err) => error(err));

															await fs
																.copy(
																	util.relative(
																		'../templates/sveltekit/template-files/db/turso/drizzle/migrate.ts',
																		import.meta.url
																	),
																	path.join(dir, 'migrate.ts')
																)
																.catch((err) => error(err));

															await addScript(dir, {
																name: 'migrations:run',
																script: 'npx tsx migrate.ts',
															});

															await addScript(dir, {
																name: 'migrations:generate',
																script: 'drizzle-kit generate',
															});
														},
														startMessage:
															'Installing and configuring drizzle-orm for Turso',
														endMessage:
															'Installed and configured drizzle-orm for Turso',
													},
												},
											],
										},
									];
								},
							},
						},
						{
							name: 'Xata',
							hint: 'Free forever, 10 DB Branches, 15GB storage',
							select: {
								run: async ({ state, dir }) => {
									state.usingDatabase = 'xata';

									const rcPath = path.join(dir, '.xatarc');

									await fs.copy(
										util.relative(
											'../templates/sveltekit/template-files/db/xata/.xatarc',
											import.meta.url
										),
										rcPath
									);

									await fs.copy(
										util.relative(
											'../templates/sveltekit/template-files/db/xata/xata.ts',
											import.meta.url
										),
										path.join(dir, 'src/lib/db/xata.ts')
									);

									const envPath = path.join(dir, '.env');

									let existed = true;

									if (!(await fs.exists(envPath))) {
										existed = false;
										await fs.createFile(envPath);
									}

									let envContent = (await fs.readFile(envPath)).toString();

									envContent =
										envContent +
										`${existed ? `\r\n` : ''}XATA_BRANCH="main"\r\nXATA_API_KEY`;

									await fs.writeFile(envPath, envContent);

									return [
										{
											kind: 'confirm',
											message: 'Setup database URL?',
											yes: {
												run: async () => {
													return [
														{
															kind: 'text',
															message: 'What is your database url?',
															placeholder: '(right click to paste)',
															validate: (dbUrl) => {
																if (dbUrl == '')
																	return 'Please enter a database URL.';

																let url: URL;

																try {
																	url = new URL(dbUrl);
																} catch (_) {
																	return 'Please provide a valid URL.';
																}

																if (url.protocol != 'https:')
																	return 'Must be a secure domain!';

																if (!url.origin.endsWith('xata.sh'))
																	return "Must be from 'xata.sh'!";

																if (
																	!url.pathname.match(
																		/\/db\/\S+/g
																	)
																)
																	return 'Must reference a database!';
															},
															result: {
																run: async (result) => {
																	let content = (
																		await fs.readFile(rcPath)
																	).toString();

																	content = content.replace(
																		'YOUR_DATA_BASE_URL',
																		result
																	);

																	await fs.writeFile(
																		rcPath,
																		content
																	);
																},
															},
														},
													];
												},
												startMessage: 'Configuring .xatarc',
												endMessage: 'Configured .xatarc',
											},
										},
										{
											kind: 'confirm',
											message: 'Setup API Key?',
											yes: {
												run: async () => {
													return [
														{
															kind: 'password',
															message: `Enter your API key ${color.gray('(get it from https://app.xata.io/settings)')}`,
															validate: (key) => {
																if (key == '')
																	return 'Please enter your API key.';
															},
															result: {
																run: async (result) => {
																	let envContent = (
																		await fs.readFile(envPath)
																	).toString();

																	envContent = envContent.replace(
																		'XATA_API_KEY',
																		`XATA_API_KEY="${result}"`
																	);

																	await fs.writeFile(
																		envPath,
																		envContent
																	);
																},
															},
														},
													];
												},
											},
										},
										{
											kind: 'select',
											message: 'What ORM would you like to use?',
											initialValue: 'Kysely',
											options: [
												{
													name: 'Drizzle',
													hint: 'https://orm.drizzle.team/',
													select: {
														run: async ({ error }) => {
															await addDependencies(
																dir,
																packages['drizzle-orm'],
																packages['@xata.io/client'],
																packages['dotenv']
															);

															await fs
																.copy(
																	util.relative(
																		'../templates/sveltekit/template-files/db/xata/drizzle/db/http/xata-util.ts',
																		import.meta.url
																	),
																	path.join(
																		dir,
																		'src/lib/db/xata-util.ts'
																	)
																)
																.catch((err) => error(err));
														},
													},
													startMessage:
														'Installing and configuring drizzle-orm for Xata',
													endMessage:
														'Installed and configured drizzle-orm for Xata',
												},
												{
													name: 'Kysely',
													hint: 'https://kysely.dev/',
													select: {
														run: async () => {
															await addDependencies(
																dir,
																packages['@xata.io/kysely'],
																packages['@xata.io/client'],
																packages['kysely'],
																packages['dotenv']
															);

															await fs.copy(
																util.relative(
																	'../templates/sveltekit/template-files/db/xata/kysely/db/xata-util.ts',
																	import.meta.url
																),
																path.join(
																	dir,
																	'src/lib/db/xata-util.ts'
																)
															);
														},
														startMessage:
															'Installing and configuring Kysely for Xata',
														endMessage:
															'Installed and configured Kysely for Xata',
													},
												},
											],
										},
									];
								},
							},
						},
					],
				},
				{
					kind: 'multiselect',
					message: 'What features should be included?',
					options: [
						{
							name: 'sveltekit-superforms',
							select: {
								run: async ({ dir }) => {
									await addDependencies(dir, packages['sveltekit-superforms']);

									return [
										{
											kind: 'select',
											message:
												'What validation library would you like to use?',
											initialValue: 'Zod',
											options: [
												{ name: 'Arktype', npmName: 'arktype' },
												{ name: 'Joi', npmName: 'joi' },
												{
													name: 'JSON Schema',
													npmName: '@exodus/schemasafe',
												},
												{ name: 'Superstruct', npmName: 'superstruct' },
												{ name: 'TypeBox', npmName: '@sinclair/typebox' },
												{ name: 'Valibot', npmName: 'valibot' },
												{ name: 'VineJS', npmName: '@vinejs/vine' },
												{ name: 'Yup', npmName: 'yup' },
												{ name: 'Zod', npmName: 'zod' },
											].map((pack) => ({
												name: pack.name,
												hint: pack.npmName,
												select: {
													run: async ({ dir }) => {
														await addDependencies(
															dir,
															// @ts-expect-error we can index this just fine
															packages[pack.npmName]
														);
													},
												},
											})),
										},
									];
								},
								startMessage: 'Installing sveltekit-superforms',
								endMessage: 'Installed sveltekit-superforms',
							},
						},
						{
							name: 'Threlte',
							select: {
								run: async ({ dir }) => {
									await addDependencies(
										dir,
										packages['three'],
										packages['@threlte/core'],
										packages['@types/three']
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
														// @ts-expect-error we can index this just fine
														await addDependencies(dir, packages[pack]);
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
						run: async ({ dir, state }) => {
							await $({
								cwd: dir,
							})`${pm} install`;

							state.installedDependencies = true;
						},
						startMessage: 'Installing dependencies',
						endMessage: 'Installed dependencies',
					},
				},
			],
			files: [
				{
					path: 'package.json',
					type: 'text',
					content: async ({ content, name }, { projectName }) => {
						content = content.replace('"sveltekit-template"', `"${projectName}"`);

						return { content, name };
					},
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
				];

				// generate files
				for (const file of files) {
					await fs.writeFile(path.join(dir, file.name), file.content);
				}
			},
			completed: async ({ state, projectName, dir }) => {
				// Adds the /.sveltekit ignore back after completion
				const ignorePath = path.join(dir, '.gitignore');

				let ignoreContent = (await fs.readFile(ignorePath)).toString();

				ignoreContent = ignoreContent.replace('.vercel', '.vercel\r\n/.svelte-kit');

				await fs.writeFile(ignorePath, ignoreContent);

				// Show next steps

				let nextSteps = `Next steps:\n   1. ${color.cyan(`cd ${projectName}`)}`;

				let step = 2;

				if (!state.installedDependencies) {
					nextSteps = nextSteps + `\n   2. ${color.cyan(`npm install`)}`;
					step++;
				}

				if (state.addedProviders.length > 0) {
					nextSteps =
						nextSteps +
						`\n   ${step}. Configure providers (${state.addedProviders.join(', ')}) in .env. See the Auth.js docs https://authjs.dev/getting-started/authentication/oauth`;

					step++;
				}

				if (state.usingDatabase) {
					if (state.usingDatabase == 'turso') {
						nextSteps =
							nextSteps +
							`\n   ${step}. Create your schema in ${color.cyan('src/lib/db/schema.ts')}`;
						step++;
						nextSteps =
							nextSteps +
							`\n   ${step}. Run ${color.cyan('npm run migrations:generate')} to generate migrations`;
						step++;
						nextSteps =
							nextSteps +
							`\n   ${step}. Run ${color.cyan('npm run migrations:run')} to run migrations`;
						step++;
					} else if (state.usingDatabase == 'xata') {
						nextSteps =
							nextSteps +
							`\n   ${step}. Install the Xata CLI ${color.cyan(`npm install -g '@xata.io/cli'`)}`;
						step++;
						nextSteps =
							nextSteps +
							`\n   ${step}. Authenticate with ${color.cyan(`xata auth login`)}`;
						step++;
						nextSteps =
							nextSteps +
							`\n   ${step}. Generate schema from database with ${color.cyan(`xata pull main`)}`;
						step++;
					}
				}

				nextSteps = nextSteps + `\n   ${step}. ${color.cyan(`npm run dev -- --open`)}`;

				step++;

				nextSteps += '\n';

				console.log(nextSteps);
			},
		} satisfies Template<SveltekitTemplateState>,
		{
			name: 'template-factory Project',
			flag: 'template-factory',
			path: util.relative('../templates/template-factory', import.meta.url),
			excludeFiles: ['package-lock.json', 'node_modules', 'template-files'],
			prompts: [
				{
					kind: 'confirm',
					message: 'Would you like to use TypeScript?',
					initialValue: true,
					yes: {
						run: async ({ dir }) => {
							await addDependencies(
								dir,
								packages['unbuild'],
								packages['typescript'],
								packages['@types/fs-extra']
							);

							const buildConfigPath = util.relative(
								'../templates/template-factory/template-files/build.config.ts',
								import.meta.url
							);

							await fs.copy(buildConfigPath, path.join(dir, 'build.config.ts'));

							await addScript(dir, {
								name: 'start',
								script: 'unbuild && node bin.mjs',
							});

							await addScript(dir, {
								name: 'build',
								script: 'unbuild',
							});

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
							await addScript(dir, { name: 'start', script: 'node bin.mjs' });

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
							await addDependencies(dir, packages['prettier']);

							const prettierrcPath = util.relative(
								'../templates/template-factory/template-files/.prettierrc',
								import.meta.url
							);

							await fs.copy(prettierrcPath, path.join(dir, '.prettierrc'));

							await fs.writeFile(path.join(dir, '.prettierignore'), 'templates');

							await addScript(dir, {
								name: 'format',
								script: 'npx prettier . --write',
							});
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
				installDependencies({ pm: 'npm', choosePackageManager: false }),
			],
			files: [
				{
					path: 'package.json',
					type: 'text',
					content: async ({ content, name }, { projectName }) => {
						content = content.replace(
							'"template-placeholder-name"',
							`"${projectName}"`
						);

						return { content, name };
					},
				},
			],
		} satisfies Template<unknown>,
		{
			name: 'ts-package',
			flag: 'ts-package',
			path: util.relative('../templates/ts-package', import.meta.url),
			state: { ciSteps: [] },
			excludeFiles: ['node_modules', 'template-files'],
			prompts: [
				{
					message: 'What features would you like to add?',
					kind: 'multiselect',
					required: false,
					options: [
						{
							name: 'biome',
							select: {
								startMessage: 'Adding biome',
								endMessage: 'Added biome',
								run: async ({ dir, error }) => {
									try {
										const biomeJson = util.relative(
											'../templates/ts-package/template-files/biome.json',
											import.meta.url
										);
										await fs.copyFile(biomeJson, path.join(dir, 'biome.json'));

										await addScript(dir, {
											name: 'lint',
											script: 'biome lint --write',
										});
										await addScript(dir, {
											name: 'format',
											script: 'biome format --write',
										});
										await addScript(dir, {
											name: 'check',
											script: 'biome check',
										});

										const ciPath = path.join(dir, '.github/workflows/ci.yml');

										let ci = (await fs.readFile(ciPath)).toString();

										ci = ci.replace(`#- name: Lint`, `- name: Lint`);
										ci = ci.replace(`#  run: pnpm check`, `  run: pnpm check`);

										await fs.writeFile(ciPath, ci);

										await addDependencies(dir, packages['@biomejs/biome']);
									} catch (err) {
										error(`Error setting up biome: ${err}`);
									}
								},
							},
						},
						{
							name: 'vitest',
							select: {
								startMessage: 'Adding vitest',
								endMessage: 'Added vitest',
								run: async ({ dir, error }) => {
									try {
										const testTs = util.relative(
											'../templates/ts-package/template-files/index.test.ts',
											import.meta.url
										);
										await fs.copyFile(testTs, path.join(dir, 'index.test.ts'));

										await addScript(dir, { name: 'test', script: 'vitest' });

										const ciPath = path.join(dir, '.github/workflows/ci.yml');

										let ci = (await fs.readFile(ciPath)).toString();

										ci = ci.replace(`#- name: Test`, `- name: Test`);
										ci = ci.replace(`#  run: pnpm test`, `  run: pnpm test`);

										await fs.writeFile(ciPath, ci);

										await addDependencies(dir, packages['vitest']);
									} catch (err) {
										error(`Error setting up vitest: ${err}`);
									}
								},
							},
						},
						{
							name: 'changesets',
							select: {
								startMessage: 'Adding changesets',
								endMessage: 'Added changesets',
								run: async ({ dir, error }) => {
									try {
										const configJson = util.relative(
											'../templates/ts-package/template-files/config.json',
											import.meta.url
										);

										await fs.mkdir(path.join(dir, './.changeset'));

										await fs.copyFile(
											configJson,
											path.join(dir, './.changeset/config.json')
										);

										const publishYml = util.relative(
											'../templates/ts-package/template-files/.github/workflows/publish.yml',
											import.meta.url
										);
										await fs.copyFile(
											publishYml,
											path.join(dir, './.github/workflows/publish.yml')
										);

										await addScript(dir, {
											name: 'changeset',
											script: 'changeset',
										});
										await addScript(dir, {
											name: 'ci:release',
											script: 'unbuild && changeset publish',
										});

										await addDependencies(dir, packages['@changesets/cli']);
									} catch (err) {
										error(`Error setting up changesets: ${err}`);
									}
								},
							},
						},
						{
							name: 'ts-blocks',
							select: {
								startMessage: 'Adding ts-blocks',
								endMessage: 'Added ts-blocks',
								run: async ({ dir, error }) => {
									try {
										const blocksJson = util.relative(
											'../templates/ts-package/template-files/blocks.json',
											import.meta.url
										);
										await fs.copyFile(
											blocksJson,
											path.join(dir, 'blocks.json')
										);
									} catch (err) {
										error(`Error setting up ts-blocks: ${err}`);
									}
								},
							},
						},
					],
				},
			],
			files: [
				{
					path: 'package.json',
					type: 'text',
					content: async ({ content, name }, { projectName }) => {
						content = content.replace('package-placeholder', `${projectName}`);

						return { content, name };
					},
				},
				{
					path: 'README.md',
					type: 'text',
					content: async ({ content, name }, { projectName }) => {
						content = `# ${projectName}\n`;

						return { content, name };
					},
				},
			],
		} satisfies Template<unknown>,
	];

	// get version from package.json
	const { version, name } = JSON.parse(
		fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
	);

	// create template
	await create({
		appName: name,
		templates: templates,
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
	} as CreateOptions);
};

main();
