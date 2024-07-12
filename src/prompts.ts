import { Prompt } from 'template-factory';
import { execa } from 'execa';
import { addDependencies, removeDependency } from './util';
import fs from 'fs-extra';
import path from 'node:path';
import { PM } from 'detect-package-manager';
import {
	iisSvelteConfig,
	SVELTE_CONFIG_FILE_VERCEL,
	VERCEL_ANALYTICS_HOOKS_CLIENT_TS,
	VERCEL_SPEED_INSIGHTS_HOOKS_CLIENT_TS,
} from './template-files';

export const getPrompts = ({ pm }: { pm: PM }): Prompt[] => {
	return [
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

							await addDependencies(['@sveltejs/adapter-vercel'], 'dev', { pm, dir });

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
												startMessage: 'Setting up @vercel/analytics',
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
							await removeDependency('@sveltejs/adapter-auto', { pm, dir });

							await addDependencies(['sveltekit-adapter-iis'], 'dev', { pm, dir });

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
					await addDependencies(['zod', 'sveltekit-superforms'], 'regular', { pm, dir });

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
				run: async ({ dir }) => {
					await execa({
						cwd: dir,
					})`${pm} install`;
				},
				startMessage: 'Installing dependencies',
				endMessage: 'Installed dependencies',
			},
		},
	];
};
