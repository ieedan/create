import fs from 'fs-extra';
import path from 'node:path';
import { create, type Template } from 'template-factory';
import { detect } from 'detect-package-manager';
import { getPrompts } from './prompts';
import color from 'chalk';

const main = async () => {
	// detect package manager
	const pm = await detect();

	// define the project templates inside of `/templates` here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: 'templates/sveltekit',
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
				const file = path.join(dir, 'README.md');

				const content = `# ${projectName}
This project was created for you with the help of [template-factory](https://github.com/ieedan/template-factory-js)`;

				await fs.writeFile(file, content);
			},
		},
	];

	// get version from package.json
	const { version } = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

	// create template
	await create({
		appName: '@ieedan/templates',
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
