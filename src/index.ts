import fs from 'fs-extra';
import path from 'node:path';
import { create, Template } from 'template-factory';
import { getPrompts } from './prompts';
import color from 'chalk';
import { SVELTEKIT_GIT_IGNORE, SVELTEKIT_NPMRC } from './template-files';

const main = async () => {
	const pm = 'npm';

	// define the project templates inside of `/templates` here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: new URL('templates/sveltekit', import.meta.url).pathname.slice(1),
			excludeFiles: ['README.md', 'package-lock.json'],
			prompts: getPrompts({ pm }),
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
