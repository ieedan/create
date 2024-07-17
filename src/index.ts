import fs from 'fs-extra';
import path from 'node:path';
import { create, CreateOptions, Prompt, Template } from 'template-factory';
import * as util from 'template-factory/util';
import { installDependencies } from 'template-factory/plugins/js/prompts';
import color from 'chalk';
import { execa } from 'execa';
import { addDependencies, removeDependency } from './util';
import { SveltekitTemplateState } from './types';

const main = async () => {
  const pm = 'npm';

  // define the project templates inside of `/templates` here
  const templates = [
    {
      name: 'SvelteKit',
      flag: 'sveltekit',
      path: util.relative('../templates/sveltekit', import.meta.url),
      excludeFiles: ['package-lock.json', 'node_modules', 'template-files'],
      state: { installedDependencies: false, addedProviders: [] },
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
                              await addDependencies(['@vercel/analytics'], 'dev', {
                                pm,
                                dir,
                              });

                              const hooksPath = path.join(dir, '/src/hooks.client.ts');

                              if (!(await fs.exists(hooksPath))) {
                                const codePath = util.relative(
                                  '../templates/sveltekit/template-files/deployment/vercel/hooks.client.ts/+analytics/hooks.client.ts',
                                  import.meta.url
                                );

                                await fs.copy(codePath, hooksPath);
                              } else {
                                let code = (await fs.readFile(hooksPath)).toString();

                                code =
                                  `import { dev } from "$app/environment";\r\nimport { inject } from "@vercel/analytics";\r\n` +
                                  code +
                                  '\r\ninject({ mode: dev ? "development" : "production" });';

                                await fs.writeFile(hooksPath, code);
                              }
                            },
                            startMessage: 'Setting up @vercel/analytics',
                            endMessage: 'Setup @vercel/analytics',
                          },
                        },
                        {
                          name: '@vercel/speed-insights',
                          select: {
                            run: async ({ dir }) => {
                              await addDependencies(['@vercel/speed-insights'], 'dev', { pm, dir });

                              const hooksPath = path.join(dir, '/src/hooks.client.ts');

                              if (!(await fs.exists(hooksPath))) {
                                const codePath = util.relative(
                                  '../templates/sveltekit/template-files/deployment/vercel/hooks.client.ts/+speed-insights/hooks.client.ts',
                                  import.meta.url
                                );

                                await fs.copy(codePath, hooksPath);
                              } else {
                                let code = (await fs.readFile(hooksPath)).toString();

                                code =
                                  `import { injectSpeedInsights } from "@vercel/speed-insights/sveltekit";\r\n` +
                                  code +
                                  '\r\ninjectSpeedInsights();';

                                await fs.writeFile(hooksPath, code);
                              }
                            },
                            startMessage: 'Setting up @vercel/speed-insights',
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
          kind: 'confirm',
          message: 'Would you like to setup authentication?',
          yes: {
            run: async () => {
              return [
                {
                  kind: 'select',
                  message: 'What auth library would you like to use?',
                  options: [
                    {
                      name: 'Auth.js',
                      select: {
                        run: async ({ dir, projectName, error }) => {
                          await addDependencies(['@auth/sveltekit'], 'regular', {
                            pm,
                            dir,
                          });

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
                            .mkdir(path.join(dir, 'src/lib/auth'), { recursive: true })
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
                            .copy(providersPath, path.join(dir, 'src/lib/auth/providers.ts'))
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

                          const signInSveltePath = path.join(dir, 'src/routes/signin/+page.svelte');

                          let signInContent = (await fs.readFile(signInSveltePath)).toString();

                          signInContent = signInContent.replace(`{{ PROJECT_NAME }}`, projectName);

                          await fs
                            .writeFile(signInSveltePath, signInContent)
                            .catch((err) => error(err));

                          const signoutPath = util.relative(
                            '../templates/sveltekit/template-files/auth/Auth.js/routes/signout/+page.server.ts',
                            import.meta.url
                          );

                          await fs
                            .createFile(path.join(dir, 'src/routes/signout/+page.server.ts'))
                            .catch((err) => error(err));

                          await fs
                            .copy(signoutPath, path.join(dir, 'src/routes/signout/+page.server.ts'))
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

                          const componentIconsDir = path.join(dir, 'src/lib/components/icons');

                          if (!(await fs.exists(componentIconsDir))) {
                            await fs
                              .mkdir(componentIconsDir, { recursive: true })
                              .catch((err) => error(err));
                          }

                          const assetIconsDir = path.join(dir, 'src/lib/assets/icons');

                          if (!(await fs.exists(assetIconsDir))) {
                            await fs
                              .mkdir(assetIconsDir, { recursive: true })
                              .catch((err) => error(err));
                          }

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

                                  await fs.writeFile(path.join(dir, '.env'), envFile);
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

                                    let envFile = (await fs.readFile(envPath)).toString();

                                    envFile =
                                      envFile +
                                      `\r\n# Setup ${provider.name} app here ${provider.docs}` +
                                      `\r\nAUTH_${provider.name.toUpperCase()}_ID` +
                                      `\r\nAUTH_${provider.name.toUpperCase()}_SECRET`;

                                    await fs.writeFile(envPath, envFile).catch((err) => error(err));

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

                                  const providersPath = path.join(dir, 'src/lib/auth/providers.ts');

                                  let providersFile = (await fs.readFile(providersPath)).toString();

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

                                  const mappedProviders = result.map((provider, index) => {
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
                                  });

                                  signInContent = signInContent.replace(
                                    'Continue with {provider.name}',
                                    mappedProviders.join('\r\n') +
                                      '\r\n\t\t\t\t\tContinue with {provider.name}'
                                  );

                                  await fs.writeFile(signInSveltePath, signInContent);

                                  const componentIconsExportPath = path.join(
                                    componentIconsDir,
                                    'index.ts'
                                  );

                                  const mappedImports = providers.map((provider) => {
                                    return `import ${provider} from './${provider.toLowerCase()}.svelte';`;
                                  });

                                  const exportFile =
                                    mappedImports.join('\r\n') +
                                    `\r\n\r\nexport { ${result.join(', ')} };`;

                                  await fs
                                    .writeFile(componentIconsExportPath, exportFile)
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
              ];
            },
          },
        },
        {
          kind: 'confirm',
          message: 'Would you like to setup a database?',
          yes: {
            run: async () => {
              return [
                {
                  kind: 'select',
                  message: 'What database would you like to use?',
                  options: [
					{
						name: "Turso",
						hint: "Free, 500 DBs, 9GB total storage, 1B row reads"
					},
                    {
                      name: 'Xata',
					  hint: "Free forever, 10 DB Branches, 15gb storage",
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
                                      validate: (dbUrl) => {
                                        if (dbUrl == '') return 'Please enter a database URL.';

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

                                        if (!url.pathname.match(/\/db\/\S+/g))
                                          return 'Must reference a database!';
                                      },
                                      result: {
                                        run: async (result) => {
                                          let content = (await fs.readFile(rcPath)).toString();

                                          content = content.replace('YOUR_DATA_BASE_URL', result);

                                          await fs.writeFile(rcPath, content);
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
								kind: "select",
								message: "What ORM would you like to use?",
								initialValue: "Kysely",
								options: [
									{
										name: "Drizzle",
									},
									{
										name: "Kysely"
									}
								]
							}
                          ];
                        },
                      },
                    }
                  ],
                },
              ];
            },
          },
        },
        {
          kind: 'multiselect',
          message: 'What features should be included?',
          options: [
            {
              name: 'sveltekit-superforms',
              select: {
                run: async ({ dir }) => {
                  await addDependencies(['zod', 'sveltekit-superforms'], 'regular', {
                    pm,
                    dir,
                  });
                },
                startMessage: 'Installing zod, and sveltekit-superforms',
                endMessage: 'Installed sveltekit-superforms',
              },
            },
            {
              name: 'Threlte',
              select: {
                run: async ({ dir }) => {
                  await addDependencies(['@threlte/core', 'three', '@types/three'], 'regular', {
                    pm,
                    dir,
                  });

                  return [
                    {
                      message: 'Do you want to install any other @threlte packages?',
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
            run: async ({ dir, state }) => {
              await execa({
                cwd: dir,
              })`${pm} install`;

              state.installedDependencies = true;
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
                util.relative('../templates/sveltekit/template-files/npmrc.txt', import.meta.url)
              )
            ).toString(),
          },
        ];

        // generate files
        for (const file of files) {
          await fs.writeFile(path.join(dir, file.name), file.content);
        }
      },
      completed: async ({ state, projectName }) => {
        let nextSteps = `Next steps:
   1. ${color.cyan(`cd ${projectName}`)}`;

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
              await addDependencies(['typescript', 'unbuild', '@types/fs-extra'], 'dev', {
                pm,
                dir,
              });

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
        installDependencies({ pm: 'npm', choosePackageManager: false }),
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
