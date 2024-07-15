import { execa, ExecaError } from 'execa';
import fs from 'fs-extra';
import path from 'node:path';

/** Allows you to remove dependency without creating node_modules */
export const removeDependency = async (packageName: string, { dir }: { dir: string }) => {
	const file = path.join(dir, 'package.json');

	const pkg = JSON.parse((await fs.readFile(file)).toString());

	pkg.devDependencies[packageName] = undefined;
	pkg.dependencies[packageName] = undefined;

	const newFile = JSON.stringify(pkg, null, 2);

	await fs.writeFile(file, newFile);
};

/** Allows you to add dependency without creating node_modules */
export const addDependencies = async (
	packages: string[],
	scope: 'dev' | 'regular',
	{ pm, dir }: { pm: string; dir: string }
) => {
	const flags = [
		scope == 'dev' ? '--save-dev' : '--save',
		'--package-lock-only',
		'--no-package-lock',
	];

	try {
		await execa(pm, ['install', ...flags, ...packages], {
			cwd: dir,
		});
	} catch (error) {
		if (error instanceof ExecaError) {
			console.error(error);
		}
	}
};
