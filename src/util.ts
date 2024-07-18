import path from 'path';
import fs from 'fs-extra';

export const addScript = async (dir: string, { name, script }: { name: string; script: string }) => {
	const packagePath = path.join(dir, 'package.json');

	const pkg = JSON.parse((await fs.readFile(packagePath)).toString());

	pkg.scripts[name] = script;

	await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
};
