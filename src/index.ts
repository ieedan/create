import fs from 'fs-extra';
import path from 'node:path';
import { create, Template } from 'template-factory';
import { getPrompts } from './prompts';
import color from 'chalk';

const main = async () => {
	const pm = "npm";

	// define the project templates inside of `/templates` here
	const templates: Template[] = [
		{
			name: 'SvelteKit',
			flag: 'sveltekit',
			path: new URL("templates/sveltekit", import.meta.url).pathname.slice(1),
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
	const { version, name } = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf-8'));

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
